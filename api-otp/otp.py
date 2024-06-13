import hashlib
import random
import redis
import psycopg2
import smtplib
from email.message import EmailMessage
from flask import Flask, request, jsonify
from dotenv import load_dotenv
from datetime import datetime
import os

# Load environment variables
load_dotenv()

# Initialize Flask app
app = Flask(__name__)

# Setup database connection
def get_db_connection():
    conn = psycopg2.connect(
        dbname=os.getenv("POSTGRES_DB"),
        user=os.getenv("POSTGRES_USER"),
        password=os.getenv("POSTGRES_PASSWORD"),
        host=os.getenv("POSTGRES_HOST")
    )
    return conn

# Setup Redis connection
def get_redis_connection():
    r = redis.Redis(
        host=os.getenv("REDIS_HOST"),
        port=os.getenv("REDIS_PORT"),
        password=os.getenv("REDIS_PASSWORD"),
        decode_responses=True
    )
    return r

# Helper function to send email
def send_email(otp, recipient):
    msg = EmailMessage()
    msg.set_content(f"Your OTP is: {otp}")
    msg['Subject'] = 'Your OTP'
    msg['From'] = os.getenv("EMAIL_USER")
    msg['To'] = recipient

    with smtplib.SMTP_SSL('smtp.gmail.com', 465) as smtp:
        smtp.login(os.getenv("EMAIL_USER"), os.getenv("EMAIL_PASSWORD"))
        smtp.send_message(msg)

# Helper function to hash OTP
def hash_otp(otp):
    return hashlib.sha256(otp.encode()).hexdigest()

# Route to request OTP
@app.route('/request_otp', methods=['POST'])
def request_otp():
    username = request.json['username']
    try:
        conn = get_db_connection()
        cur = conn.cursor()
        cur.execute("SELECT email, email_verified FROM utilisateurs WHERE username = %s", (username,))
        user_data = cur.fetchone()
        cur.close()
        conn.close()

        if user_data and user_data[1]:  # Checking if email_verified is True
            email = user_data[0]
            otp = f"{random.randint(100000, 999999)}"  # Generate a 6-digit OTP
            send_email(otp, email)
            otp_hash = hash_otp(otp)
            
            # Store OTP hash in Redis with additional data
            redis_conn = get_redis_connection()
            redis_conn.set(email, otp_hash)
            redis_conn.set(f"{email}_created", str(datetime.now()))
            redis_conn.set(f"{email}_attempts", 0)
            
            return jsonify({'message': 'OTP sent successfully'}), 200
        else:
            return jsonify({'error': 'User not verified or does not exist'}), 404
    except Exception as e:
        return jsonify({'error': str(e)}), 500

# Route to verify OTP
@app.route('/verify_otp', methods=['POST'])
def verify_otp():
    username = request.json['username']
    otp_hash_provided = request.json['otp']
    try:
        conn = get_db_connection()
        cur = conn.cursor()
        cur.execute("SELECT email FROM utilisateurs WHERE username = %s", (username,))
        email = cur.fetchone()[0]
        cur.close()
        conn.close()

        # Retrieve the hashed OTP from Redis
        redis_conn = get_redis_connection()
        otp_hash_stored = redis_conn.get(email)

        # Check if the provided OTP hash matches the stored hash
        if otp_hash_stored == otp_hash_provided:
            # Optionally, you could increase attempts or check for expiration here
            return jsonify({'message': 'OTP verification successful'}), 200
        else:
            return jsonify({'error': 'Invalid OTP'}), 400
    except Exception as e:
        return jsonify({'error': str(e)}), 500

# Running the Flask application
if __name__ == "__main__":
    app.run(host="0.0.0.0", port=80, debug=True)

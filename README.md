ADIVASI BANDHU

Adivasi Bandhu is a web platform developed to help tribal communities easily access information about various government welfare schemes. The system provides a simple and user-friendly interface where users can explore schemes, ask questions, and receive support.

The platform aims to reduce the information gap and ensure that tribal communities can benefit from government initiatives related to education, employment, healthcare, and financial assistance.


FEATURES

- User Registration and Login System
- Browse Government Schemes Information
- User Profile with Profile Picture
- Contact and Help Query System
- Real-Time Support Chat using WebSockets
- Admin Panel for Managing Users and Queries
- Unread Message Notification System
- Responsive UI Design


TECHNOLOGIES USED

Backend: Python, Django
Frontend: HTML, CSS, JavaScript, Bootstrap
Real-Time Communication: Django Channels (WebSockets)
Database: SQLite
Version Control: Git and GitHub


PROJECT STRUCTURE

adivasi_backend/
│
├── adivasibandhu/        (Project settings)
├── main/                 (Main application)
│   ├── models.py
│   ├── views.py
│   ├── consumers.py
│   ├── urls.py
│   ├── templates/
│   └── static/
│
├── media/                (Uploaded files such as profile pictures)
├── manage.py
└── requirements.txt


INSTALLATION

1. Clone the repository

git clone https://github.com/your-username/adivasi-bandhu.git
cd adivasi-bandhu


2. Create virtual environment

python -m venv venv


3. Activate environment

Windows:
venv\Scripts\activate

Mac/Linux:
source venv/bin/activate


4. Install dependencies

pip install -r requirements.txt


5. Run migrations

python manage.py migrate


6. Create superuser

python manage.py createsuperuser


7. Run server

python manage.py runserver


Open in browser:
http://127.0.0.1:8000


REAL-TIME SUPPORT CHAT

The platform includes a real-time support chat system where users can communicate with administrators. It is implemented using Django Channels and WebSockets, allowing instant message delivery and unread message notifications.


FUTURE IMPROVEMENTS

- Multilingual Support for Tribal Languages
- Mobile Application Integration
- AI Chatbot for Automated Support
- Advanced Scheme Search and Filtering


AUTHOR

Yash Srivastava


LICENSE

This project is for educational and development purposes.

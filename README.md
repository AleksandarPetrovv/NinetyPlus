
# ⚽ **NinetyPlus**

  

**NinetyPlus** is a real-time football scoring app with a social edge. Get live scores, stats, fixtures, and **comment on matches** with fans around the world. Whether it's El Clásico or a late-night Premier League clash, join the conversation and never miss a moment.

**Demo: https://drive.google.com/file/d/1KstOzOwPAnhDqjehT3yYA0Rgq1XyjGY9/view?usp=share_link**

  

---

  

## 🚀 **Features**

  

- 📅 **Live Scores & Fixtures**

Follow real-time match updates and upcoming games.

  

- 📊 **League Standings & Stats**

Dive into team performance, match data, and rankings.

  

- 💬 **Match Comments**

Share your thoughts live with other fans.

  

- 🌍 **Global Coverage**

Powered by [football-data.org](https://www.football-data.org/) for all major leagues.

  

---

  

## 🛠️ **Technologies**

  

- **Frontend:** ReactJS + Tailwind CSS

- **Backend:** Django

- **Database:** MySQL

- **API:**  [football-data.org](https://www.football-data.org/)

  

---

  

## ⬇️ **Installation**

  

### 1. **Clone the repository**

  
```bash
git clone https://github.com/AleksandarPetrovv/NinetyPlus
cd NinetyPlus
```

  

### 2. **Backend Setup**

  
```bash
cd backend
python -m venv venv
```

  

- #### Activate virtual environment

  
```bash
# For Windows
venv\Scripts\activate

  

# For macOS/Linux
source venv/bin/activate
```

  

- #### Install dependencies

  
```bash
pip install -r requirements.txt
```

- #### Copy your secret django key


```bash
python -c "from django.core.management.utils import get_random_secret_key; print(get_random_secret_key())"
```

- #### Create `.env` file


```dotenv
SECRET_KEY=your_django_secret_key
DEBUG=True
ALLOWED_HOSTS=localhost,127.0.0.1

DB_NAME=ninetyplus
DB_USER=your_db_username
DB_PASSWORD=your_db_password
DB_HOST=localhost
DB_PORT=3306

FOOTBALL_API_KEY=your_football_data_api_key
```

  

- #### Set up the database

  
```sql
mysql -u root -p

CREATE  DATABASE ninetyplus;
CREATE  USER  'your_db_username'@'localhost' IDENTIFIED BY  'your_db_password';
GRANT  ALL  PRIVILEGES  ON ninetyplus.*  TO  'your_db_username'@'localhost';
FLUSH PRIVILEGES;
EXIT;
```

  

- #### Run migrations and start server

  
```bash
python manage.py makemigrations
python manage.py migrate
python manage.py runserver
```


### 3. **Frontend Setup**

- #### Open new terminal
```bash
cd frontend
```

- #### Install dependencies
```bash
npm install
```

- #### Create .env file
```dotenv
VITE_API_URL=http://localhost:8000/api
```

- #### Start vite server
```bash
npm run dev
```

# Open the link provided by Vite and you are all done!

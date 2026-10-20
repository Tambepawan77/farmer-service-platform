# Farmer Service Platform

A simple website where **farmers** find agricultural services (tractor, harvesting, spraying, labour, transport…), see the provider's rate, and send a booking request. **Service providers** list their services and accept or reject requests.

| Part | Technology |
|---|---|
| Website (frontend) | React + Vite |
| API (backend) | FastAPI (Python) |
| Database | SQLite on your Mac, **PostgreSQL on AWS RDS** on the server |
| Hosting | One AWS EC2 server (Docker) + RDS database |

```
farmer-service-platform/
├── backend/            FastAPI code  (app/main.py is the start file)
├── frontend/           React code    (src/pages = each screen)
├── docker-compose.yml  starts everything on the AWS server
└── README.md           this guide
```

Demo logins (created automatically on the first start):
- Farmer: `farmer@demo.com` / `demo1234`
- Provider: `provider@demo.com` / `demo1234`

---

## Part 1. Run it on your MacBook Air M1

### Step 1. Install the tools (once)
Open **Terminal** and check what you already have:
```bash
python3 --version     # need 3.10 or newer
node --version        # need 18 or newer
```
If something is missing, install Homebrew from brew.sh, then:
```bash
brew install python node
```
Install **Visual Studio Code**, then unzip this project and open it: *File → Open Folder → farmer-service-platform*.

### Step 2. Start the backend (Terminal 1)
In VS Code open the terminal (*Terminal → New Terminal*):
```bash
cd backend
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
cp .env.example .env
uvicorn app.main:app --reload
```
Open http://127.0.0.1:8000/docs. You will see every API endpoint and can try them. A file `farmer.db` appears: that is your local database.

### Step 3. Start the frontend (Terminal 2)
Click the **+** in the VS Code terminal to open a second terminal:
```bash
cd frontend
npm install
npm run dev
```
Open http://localhost:5173 and log in with a demo account.

**Try this flow:** log in as farmer → open a service → send a booking request → log out → log in as provider → Accept it → log in as farmer again and see the new status.

### How the code is organised (read this once)
- `backend/app/models.py`: the three tables: users, services, bookings.
- `backend/app/routers/`: the API: `auth.py` (sign up, log in), `services.py`, `bookings.py`.
- `frontend/src/api.js`: one function that talks to the API. `frontend/src/auth.jsx`: keeps the user logged in.
- `frontend/src/pages/`: one file per screen. `styles.css`: all the design.

---

## Part 2. Deploy on AWS (step by step)

Plan: **one EC2 server** runs the website and the API in Docker. **RDS PostgreSQL** is the database. Everything uses the same region. Use **Asia Pacific (Mumbai) ap-south-1**, which is closest to you.

> **Free plan check (important).** AWS accounts created after 15 July 2025 get a *6 month free plan* with credits (up to about $200). Open **Billing → Free Tier** in the console to see your exact credits and end date. Rules change, so always trust that page over this guide. After the plan ends or credits finish, resources can start costing money, so do Step 0 and Step 9.

### Step 0. Protect yourself from surprise bills
1. Console → **Billing and Cost Management → Budgets → Create budget** → *Zero spend budget* (or a monthly budget of $5) with your email.
2. Turn on MFA for your root user (*top right menu → Security credentials*).

### Step 1. Create the server (EC2)
1. Console → set region **Mumbai** (top right) → **EC2 → Launch instance**.
2. Name: `farmer-server`. Image: **Ubuntu Server 24.04 LTS**.
3. Instance type: choose one marked **Free tier eligible** (for example `t3.micro` or `t4g.micro`). If you pick `t4g.*` it is an ARM server, which also works with this project.
4. Key pair → **Create new key pair** → name `farmer-key`, type RSA, format `.pem`. It downloads. Move it to `~/Downloads` and keep it safe.
5. Network settings → **Edit**: allow **SSH (port 22)** from *My IP*, and allow **HTTP (port 80)** from *Anywhere*.
6. Storage: 20 GB gp3 is enough. Click **Launch instance**.
7. Wait until the instance is *Running* and copy its **Public IPv4 address**.

### Step 2. Create the database (RDS PostgreSQL)
1. Console → **RDS → Create database** → *Standard create* → **PostgreSQL**.
2. Templates: **Free tier** (if shown). Instance: `db.t3.micro` or `db.t4g.micro` (whichever says free tier eligible). Storage: 20 GB.
3. DB instance identifier: `farmer-db`. Master username: `farmeradmin`. Set a password with **only letters and numbers** (for example `FarmerDb2026Pass`) and write it down.
4. **Connectivity** → *Connect to an EC2 compute resource* → select `farmer-server`. AWS then sets up the security groups for you, so only your server can reach the database. Keep *Public access* = **No**.
5. Expand **Additional configuration** → Initial database name: `farmerdb`.
6. Create database. After 5 to 10 minutes, open it and copy the **Endpoint**. It looks like `farmer-db.abc123xyz.ap-south-1.rds.amazonaws.com`.

### Step 3. Put the project on the server
On your Mac, in Terminal (adjust the paths and IP):
```bash
cd ~/Downloads
chmod 400 farmer-key.pem
# zip the project folder first if you are not using the downloaded zip
scp -i farmer-key.pem farmer-service-platform.zip ubuntu@YOUR_SERVER_IP:~
ssh -i farmer-key.pem ubuntu@YOUR_SERVER_IP
```
(Type `yes` when asked.) You are now on the server. Install the tools:
```bash
sudo apt update
sudo apt install -y docker.io docker-compose-v2 unzip
sudo usermod -aG docker ubuntu
exit
```
Log in again with the same `ssh` command (this applies the Docker permission), then:
```bash
unzip farmer-service-platform.zip
cd farmer-service-platform
```

**Small servers need swap memory** or the React build can crash. Run once:
```bash
sudo fallocate -l 2G /swapfile && sudo chmod 600 /swapfile
sudo mkswap /swapfile && sudo swapon /swapfile
```

### Step 4. Connect the API to RDS
```bash
cp backend/.env.example backend/.env
openssl rand -hex 32          # copy the long text it prints
nano backend/.env
```
Edit these lines (save with `Ctrl+O`, `Enter`, exit with `Ctrl+X`):
```
DATABASE_URL=postgresql+psycopg2://farmeradmin:FarmerDb2026Pass@YOUR-RDS-ENDPOINT:5432/farmerdb
SECRET_KEY=paste-the-long-text-here
SEED_DEMO_DATA=true
```

### Step 5. Start the website
```bash
docker compose up -d --build
```
The first build takes a few minutes. Check it:
```bash
docker compose ps
docker compose logs backend
curl http://localhost/api/health      # should print {"status":"ok"}
```
Open `http://YOUR_SERVER_IP` in your browser. Your website is live.

**If the API cannot connect to the database:** the usual causes are a wrong password or endpoint in `.env`, or the RDS security group not allowing the server. In RDS → your database → *Connectivity & security*, check that a rule for the EC2 security group on port 5432 exists. After fixing `.env` run `docker compose up -d --build`.

### Step 6. Before real users arrive
- Edit `backend/.env` and set `SEED_DEMO_DATA=false`, then `docker compose up -d` (the demo accounts have a public password).
- The server IP changes if you stop and start the instance. For a fixed address, use **EC2 → Elastic IP → Allocate**, then *Associate* it with the server. Public IPv4 addresses can be billed, so check your Free Tier page.
- HTTPS and a domain name are an optional next step (a domain plus Caddy or CloudFront). The site works over plain HTTP without them.

### Step 7. Update the site after you change the code
On your Mac, send the new zip with `scp` (Step 3), then on the server:
```bash
unzip -o farmer-service-platform.zip
cd farmer-service-platform
docker compose up -d --build
```
Your `.env` stays because the zip does not contain one. The database is untouched.

### Step 8. See your data
Data lives in RDS. To look inside from the server:
```bash
sudo apt install -y postgresql-client
psql "host=YOUR-RDS-ENDPOINT dbname=farmerdb user=farmeradmin" -c "select id,name,role from users;"
```

### Step 9. Clean up when you are done
To avoid charges: EC2 → *Terminate instance*, RDS → *Delete database* (untick the final snapshot if you do not need it), and release any Elastic IP. Then confirm on the Billing page that nothing is running.

---

## Using a different database
The code reads one setting, `DATABASE_URL`, so you can swap databases without changing code:
- **SQLite** (default, local only): `sqlite:///./farmer.db`
- **PostgreSQL anywhere** (local Docker, Neon, Supabase): `postgresql+psycopg2://user:password@host:5432/dbname`
- **MySQL**: add `pymysql` to `requirements.txt` and use `mysql+pymysql://user:password@host:3306/dbname`

## Ideas for later
Photos for services, ratings after a completed booking, SMS or WhatsApp alerts, Marathi/Hindi language switch, payments, an admin page.

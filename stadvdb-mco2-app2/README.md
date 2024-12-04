# Getting Started with Create React App
This project was bootstrapped with [Create React App](https://github.com/facebook/create-react-app).

## Create Docker Containers
> docker-compose up -d

## Set up multi-master replication
### On bother master nodes:
```sql
ALTER USER 'replication_user'@'%' IDENTIFIED WITH 'mysql_native_password' BY '<your password here>'

GRANT REPLICATION SLAVE ON *.* TO 'replication_user'@'%';
FLUSH PRIVILEGES;
SHOW MASTER STATUS;
```
### On the slave node:
```sql
CHANGE MASTER TO 
MASTER_HOST='node2-update',
  MASTER_USER='replication_user',
  MASTER_PASSWORD='<your password here>',
  MASTER_LOG_FILE=<the file you took note of in master status>',
  MASTER_LOG_POS=<the pos from master status> FOR CHANNEL 'node2-update';

CHANGE MASTER TO 
MASTER_HOST='node3-update',
  MASTER_USER='replication_user',
  MASTER_PASSWORD='<your password here>',
  MASTER_LOG_FILE=<the file you took note of in master status>',
  MASTER_LOG_POS=<the pos from master status> FOR CHANNEL 'node3-update';

START SLAVE;
SHOW SLAVE STATUS\G
```

## Install Dependencies
1. Backend
> pip install -r requirements.txt

2. Frontend
> npm install

## Change Password for SQL Versions
Open db_config.py and change the password for the sql servers.

## Scripts for Running:
### `npm start`
Runs the React app in http://localhost:3000/.


### `python run.py`
Runs the backend server for processing sql queries.

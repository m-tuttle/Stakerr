DROP DATABASE IF EXISTS project_db;
CREATE DATABASE project_db;

USE project_db;

CREATE TABLE users(
  id INT NOT NULL AUTO_INCREMENT,
  user VARCHAR(45) NOT NULL,
  email VARCHAR(45) NOT NULL,
  phone VARCHAR(15) NOT NULL,
  user_pw VARCHAR(45) NOT NULL,
  credits INTEGER DEFAULT 500,
  PRIMARY KEY (id)
);

CREATE TABLE goals(
  user_id INT NOT NULL,
  id INT NOT NULL AUTO_INCREMENT,
  goal_text VARCHAR(50) NOT NULL,
  goal_start DATE NOT NULL,
  goal_end DATE NOT NULL,
  max_wager INT NOT NULL,
  descript VARCHAR (250),
  fol INT DEFAULT 0,
  complete BOOLEAN DEFAULT 0,
  PRIMARY KEY (id)
);

CREATE TABLE wagers(
  id INT NOT NULL AUTO_INCREMENT,
  wager_amount INT NOT NULL,
  wager_fill INT NOT NULL,
  goal_id INT NOT NULL,
  user_id INT NOT NULL,
  PRIMARY KEY (id)
);

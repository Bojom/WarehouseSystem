DROP TABLE IF EXISTS transactions;
DROP TABLE IF EXISTS parts;
DROP TABLE IF EXISTS users;
DROP TABLE IF EXISTS suppliers;


CREATE TABLE suppliers (
    id SERIAL PRIMARY KEY,
    supplier_name VARCHAR(255) UNIQUE NOT NULL,
    contact TEXT
);


CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    user_name VARCHAR(100) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    user_role VARCHAR(50) NOT NULL CHECK (user_role IN ('admin', 'operator')),
    creation_time TIMESTAMP WITH TIME ZONE DEFAULT now()
);


CREATE TABLE parts (
    id SERIAL PRIMARY KEY,
    part_number VARCHAR(100) UNIQUE NOT NULL,
    part_name VARCHAR(255) NOT NULL,
    spec VARCHAR(255),
    unit VARCHAR(50) NOT NULL,
    stock INT NOT NULL DEFAULT 0,
    stock_min INT NOT NULL DEFAULT 0,
    stock_max INT NOT NULL DEFAULT 100,
    supplier_id INT REFERENCES suppliers(id) ON DELETE SET NULL, 
    creation_time TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_time TIMESTAMP WITH TIME ZONE DEFAULT now()
);


CREATE TABLE transactions (
    id SERIAL PRIMARY KEY,
    part_id INT NOT NULL REFERENCES parts(id) ON DELETE CASCADE,
    user_id INT NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
    trans_type VARCHAR(10) NOT NULL CHECK (trans_type IN ('IN', 'OUT', 'FAULT')),
    quantity INT NOT NULL CHECK (quantity > 0),
    trans_time TIMESTAMP WITH TIME ZONE DEFAULT now(),
    remarks TEXT
);


CREATE OR REPLACE FUNCTION update_modified_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_time = now();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_parts_modtime
BEFORE UPDATE ON parts
FOR EACH ROW
EXECUTE FUNCTION update_modified_column();
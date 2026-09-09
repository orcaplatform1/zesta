-- Sipariş numaraları (ORD-1024 gibi) için atomik, çakışmasız sayaç.
CREATE SEQUENCE IF NOT EXISTS order_number_seq START 1000;
GRANT USAGE, SELECT ON SEQUENCE order_number_seq TO zesta_user;

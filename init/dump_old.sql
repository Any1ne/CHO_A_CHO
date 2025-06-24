-- Creation --
CREATE TABLE categories(
    id varchar NOT NULL,
    name text NOT NULL,
    PRIMARY KEY(id)
);

CREATE TABLE customers(
    id SERIAL NOT NULL,
    name text NOT NULL,
    email text,
    phone text,
    address text,
    PRIMARY KEY(id)
);
CREATE UNIQUE INDEX customers_email_key ON public.customers USING btree (email);

CREATE TABLE flavours(
    id varchar NOT NULL,
    name text NOT NULL,
    PRIMARY KEY(id)
);

CREATE TABLE orders(
    id SERIAL NOT NULL,
    customer_id integer,
    "date" timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    status text DEFAULT 'нове'::text,
    delivery_method text,
    payment_method text,
    is_free_delivery boolean DEFAULT false,
    PRIMARY KEY(id),
    CONSTRAINT orders_customer_id_fkey FOREIGN key(customer_id) REFERENCES customers(id)
);

CREATE TABLE products(
    id varchar NOT NULL,
    title text NOT NULL,
    category_id varchar,
    flavour_id varchar,
    price integer NOT NULL,
    preview_image text,
    PRIMARY KEY(id),
    CONSTRAINT products_category_id_fkey FOREIGN key(category_id) REFERENCES categories(id),
    CONSTRAINT products_flavour_id_fkey FOREIGN key(flavour_id) REFERENCES flavours(id)
);

CREATE TABLE order_delivery_details(
    order_id integer NOT NULL,
    delivery_service varchar(100),
    delivery_type varchar(50),
    branch_number varchar(100),
    full_address text,
    city varchar(20),
    PRIMARY KEY(order_id),
    CONSTRAINT order_delivery_details_order_id_fkey FOREIGN key(order_id) REFERENCES orders(id)
);

CREATE TABLE orderitems(
    id SERIAL NOT NULL,
    order_id integer,
    product_id varchar,
    quantity integer NOT NULL,
    PRIMARY KEY(id),
    CONSTRAINT orderitems_order_id_fkey FOREIGN key(order_id) REFERENCES orders(id),
    CONSTRAINT orderitems_product_id_fkey FOREIGN key(product_id) REFERENCES products(id)
);

-- INSERTION --
INSERT INTO Categories (id, name) VALUES
(1, 'Mini'),
(2, 'Popular'),
(3, 'Nutty'),
(4, 'Heart'),
(5, 'Sugar Free'),
(6, 'Big');

INSERT INTO Flavours (id, name) VALUES
(1, 'Прапор'),
(2, 'ОРЕО'),
(3, 'КОКОС'),
(4, 'ВАНІЛЬ'),
(5, 'МАТЧА-МАЛИНА'),
(6, 'ПОЛУНИЦЯ'),
(7, 'АПЕЛЬСИН'),
(8, 'ЛАЙМ'),
(9, 'ЯГОДА'),
(10, 'ЧОРНА'),
(11, 'МОЛОЧНА'),
(12, 'ТОФІ'),
(13, 'ДИНЯ'),
(14, 'БІЛА'),
(15, 'ВЕСНЯНА');

INSERT INTO PRODUCTS (ID, title, CATEGORY_ID, PRICE, FLAVOUR_ID, PREVIEW_IMAGE) VALUES
('1-001', 'Бельгійський шоколад 15г "ПРАПОР"', 1, 17, 1, NULL),
('1-002', 'Бельгійський шоколад 15г "ОРЕО"', 1, 17, 2, NULL),
('1-003', 'Бельгійський шоколад 15г "КОКОС"', 1, 17, 3, NULL),
('1-004', 'Бельгійський шоколад 15г "ВАНІЛЬ"', 1, 17, 4, NULL),
('1-005', 'Бельгійський шоколад 15г "МАТЧА-МАЛИНА"', 1, 17, 5, NULL),
('1-006', 'Бельгійський шоколад 15г "ПОЛУНИЦЯ"', 1, 17, 6, NULL),
('1-007', 'Бельгійський шоколад 15г "АПЕЛЬСИН"', 1, 17, 7, NULL),
('1-008', 'Бельгійський шоколад 15г "ЛАЙМ"', 1, 17, 8, NULL),
('1-009', 'Бельгійський шоколад 15г "ЯГОДА"', 1, 17, 9, NULL),
('1-010', 'Бельгійський шоколад 15г "ЧОРНА"', 1, 17, 10, NULL),
('1-011', 'Бельгійський шоколад 15г "МОЛОЧНА"', 1, 17, 11, NULL),
('1-012', 'Бельгійський шоколад 15г "ТОФІ"', 1, 17, 12, NULL),
('2-001', 'Бельгійський шоколад 30г "ПРАПОР"', 2, 28, 1, NULL),
('2-002', 'Бельгійський шоколад 30г "ОРЕО"', 2, 28, 2, NULL),
('2-003', 'Бельгійський шоколад 30г "КОКОС"', 2, 28, 3, NULL),
('2-004', 'Бельгійський шоколад 30г "ВАНІЛЬ"', 2, 28, 4, NULL),
('2-005', 'Бельгійський шоколад 30г "МАТЧА-МАЛИНА"', 2, 28, 5, NULL),
('2-006', 'Бельгійський шоколад 30г "ПОЛУНИЦЯ"', 2, 28, 6, NULL),
('2-007', 'Бельгійський шоколад 30г "АПЕЛЬСИН"', 2, 28, 7, NULL),
('2-008', 'Бельгійський шоколад 30г "ЛАЙМ"', 2, 28, 8, NULL),
('2-009', 'Бельгійський шоколад 30г "ЯГОДА"', 2, 28, 9, NULL),
('2-010', 'Бельгійський шоколад 30г "ЧОРНА"', 2, 28, 10, NULL),
('2-011', 'Бельгійський шоколад 30г "МОЛОЧНА"', 2, 28, 11, NULL),
('2-012', 'Бельгійський шоколад 30г "ТОФІ"', 2, 28, 12, NULL),
('3-001', 'Бельгійський шоколад 30г з мигдалем "ПРАПОР"', 3, 33, 1, NULL),
('3-002', 'Бельгійський шоколад 30г з мигдалем "ОРЕО"', 3, 33, 2, NULL),
('3-003', 'Бельгійський шоколад 30г з мигдалем "КОКОС"', 3, 33, 3, NULL),
('3-004', 'Бельгійський шоколад 30г з мигдалем "ВАНІЛЬ"', 3, 33, 4, NULL),
('3-005', 'Бельгійський шоколад 30г з мигдалем "МАТЧА-МАЛИНА"', 3, 33, 5, NULL),
('3-006', 'Бельгійський шоколад 30г з мигдалем "ПОЛУНИЦЯ"', 3, 33, 6, NULL),
('3-007', 'Бельгійський шоколад 30г з мигдалем "АПЕЛЬСИН"', 3, 33, 7, NULL),
('3-008', 'Бельгійський шоколад 30г з мигдалем "ЛАЙМ"', 3, 33, 8, NULL),
('3-009', 'Бельгійський шоколад 30г з мигдалем "ЯГОДА"', 3, 33, 9, NULL),
('3-010', 'Бельгійський шоколад 30г з мигдалем "ЧОРНА"', 3, 33, 10, NULL),
('3-011', 'Бельгійський шоколад 30г з мигдалем "МОЛОЧНА"', 3, 33, 11, NULL),
('3-012', 'Бельгійський шоколад 30г з мигдалем "ТОФІ"', 3, 33, 12, NULL),
('4-001', 'Бельгійський шоколад 8г "ОРЕО"', 4, 13, 1, NULL),
('4-002', 'Бельгійський шоколад 8г "КОКОС"', 4, 13, 2, NULL),
('4-003', 'Бельгійський шоколад 8г "ВАНІЛЬ"', 4, 13, 3, NULL),
('4-004', 'Бельгійський шоколад 8г "МАТЧА-МАЛИНА"', 4, 13, 4, NULL),
('4-005', 'Бельгійський шоколад 8г "ПОЛУНИЦЯ"', 4, 13, 5, NULL),
('4-006', 'Бельгійський шоколад 8г "АПЕЛЬСИН"', 4, 13, 6, NULL),
('4-007', 'Бельгійський шоколад 8г "ЛАЙМ"', 4, 13, 7, NULL),
('4-008', 'Бельгійський шоколад 8г "ЯГОДА"', 4, 13, 8, NULL),
('4-009', 'Бельгійський шоколад 8г "ЧОРНА"', 4, 13, 9, NULL),
('4-010', 'Бельгійський шоколад 8г "МОЛОЧНА"', 4, 13, 10, NULL),
('4-011', 'Бельгійський шоколад 8г "ТОФІ"', 4, 13, 11, NULL),
('5-001', 'Бельгійський шоколад 25г "ТОФІ"', 5, 33, 12, NULL),
('5-002', 'Бельгійський шоколад 25г "ДИНЯ"', 5, 33, 13, NULL),
('5-003', 'Бельгійський шоколад 25г "КОКОС"', 5, 33, 2, NULL),
('5-004', 'Бельгійський шоколад 25г "БІЛА"', 5, 33, 14, NULL),
('5-005', 'Бельгійський шоколад 25г "ВЕСНЯНА"', 5, 33, 15, NULL),
('6-001', 'Бельгійський шоколад 85г "ПРАПОР"', 6, 97, 1, NULL),
('6-002', 'Бельгійський шоколад 85г "ОРЕО"', 6, 97, 2, NULL),
('6-003', 'Бельгійський шоколад 85г "КОКОС"', 6, 97, 3, NULL),
('6-004', 'Бельгійський шоколад 85г "ВАНІЛЬ"', 6, 97, 4, NULL),
('6-005', 'Бельгійський шоколад 85г "МАТЧА-МАЛИНА"', 6, 97, 5, NULL),
('6-006', 'Бельгійський шоколад 85г "ПОЛУНИЦЯ"', 6, 97, 6, NULL),
('6-007', 'Бельгійський шоколад 85г "АПЕЛЬСИН"', 6, 97, 7, NULL),
('6-008', 'Бельгійський шоколад 85г "ЛАЙМ"', 6, 97, 8, NULL),
('6-009', 'Бельгійський шоколад 85г "ЯГОДА"', 6, 97, 9, NULL),
('6-010', 'Бельгійський шоколад 85г "ЧОРНА"', 6, 97, 10, NULL),
('6-011', 'Бельгійський шоколад 85г "МОЛОЧНА"', 6, 97, 11, NULL),
('6-012', 'Бельгійський шоколад 85г "ТОФІ"', 6, 97, 12, NULL);


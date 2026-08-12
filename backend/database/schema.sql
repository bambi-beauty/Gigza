-- Gigza backend schema
-- Reverse-engineered from the SQL queries in Controllers/*.js, since no
-- migration ever existed in the repo. Run against the `gigza` database:
--   psql -U gigza -d gigza -f database/schema.sql

CREATE TABLE IF NOT EXISTS users (
    userid          SERIAL PRIMARY KEY,
    username        VARCHAR(100) NOT NULL,
    email           VARCHAR(255) NOT NULL UNIQUE,
    password        TEXT NOT NULL,
    email_verified  BOOLEAN NOT NULL DEFAULT false,
    created_at      TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS userprofile (
    profileid   SERIAL PRIMARY KEY,
    userid      INTEGER NOT NULL UNIQUE REFERENCES users(userid) ON DELETE CASCADE,
    usertype    VARCHAR(20) NOT NULL DEFAULT 'free',
    created_at  TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS DJ_profile (
    dj_id                SERIAL PRIMARY KEY,
    profileid            INTEGER NOT NULL UNIQUE REFERENCES userprofile(profileid) ON DELETE CASCADE,
    dj_name              VARCHAR(150),
    dj_experience        TEXT,
    dj_skills            TEXT,
    latitude             DOUBLE PRECISION,
    longitude            DOUBLE PRECISION,
    s2_cell_id           BIGINT,
    location_updated_at  TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_dj_profile_s2_cell ON DJ_profile(s2_cell_id);

CREATE TABLE IF NOT EXISTS ratings (
    rating_id     SERIAL PRIMARY KEY,
    dj_id         INTEGER NOT NULL REFERENCES DJ_profile(dj_id) ON DELETE CASCADE,
    user_id       INTEGER NOT NULL REFERENCES users(userid) ON DELETE CASCADE,
    rating_value  SMALLINT NOT NULL CHECK (rating_value BETWEEN 1 AND 5),
    created_at    TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at    TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    UNIQUE (dj_id, user_id)
);

CREATE TABLE IF NOT EXISTS reviews (
    review_id    SERIAL PRIMARY KEY,
    dj_id        INTEGER NOT NULL REFERENCES DJ_profile(dj_id) ON DELETE CASCADE,
    user_id      INTEGER NOT NULL REFERENCES users(userid) ON DELETE CASCADE,
    rating_id    INTEGER REFERENCES ratings(rating_id) ON DELETE SET NULL,
    review_text  TEXT NOT NULL,
    is_approved  BOOLEAN NOT NULL DEFAULT false,
    created_at   TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at   TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    UNIQUE (dj_id, user_id)
);

-- Referenced by the (currently unrouted) Controllers/DJ_Booking.js.
-- Not wired to any router yet, but the table is cheap to have ready.
CREATE TABLE IF NOT EXISTS dj_bookings (
    booking_id    SERIAL PRIMARY KEY,
    dj_id         INTEGER NOT NULL REFERENCES DJ_profile(dj_id) ON DELETE CASCADE,
    event_id      INTEGER NOT NULL,
    booking_date  TIMESTAMP NOT NULL,
    created_at    TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

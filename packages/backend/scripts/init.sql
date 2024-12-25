CREATE TABLE IF NOT EXISTS "user" (
    uid INT, 
    name VARCHAR, 
    face VARCHAR, 
    gender INT, 
    birthday INT, 
    phone VARCHAR, 
    emails VARCHAR[], 
    recruiter BOOLEAN, 
    pwd VARCHAR, 
    created_at INT
);
CREATE TABLE IF NOT EXISTS "user_participant" (
    uid INT, 
    rtype INT, 
    puid INT
);
CREATE TABLE IF NOT EXISTS "experiment" (
    eid INT, 
    type INT, 
    title VARCHAR, 
    position JSONB, 
    uid INT, 
    notice VARCHAR, 
    state INT, 
    created_at INT
);
CREATE TABLE IF NOT EXISTS "recruitment" (
    eid INT, 
    rtype INT, 
    rid INT, 
    fee INT, 
    notice VARCHAR, 
    durations INT[]
);
CREATE TABLE IF NOT EXISTS "recruitment_condition" (
    size INT, 
    rcid INT, 
    rid INT
);
CREATE TABLE IF NOT EXISTS "recruitment_participant" (
    uid INT, 
    rcid INT, 
    state INT
);

ALTER TABLE "user" ADD UNIQUE (phone);
ALTER TABLE "user" ALTER COLUMN uid SET NOT NULL;
ALTER TABLE "user" ALTER COLUMN uid ADD GENERATED ALWAYS AS IDENTITY;
ALTER TABLE "user" ADD PRIMARY KEY (uid);
ALTER TABLE "user_participant" ADD PRIMARY KEY (uid, puid, rtype);
ALTER TABLE "user_participant" ADD FOREIGN KEY (uid) REFERENCES "user"(uid);
ALTER TABLE "user_participant" ADD FOREIGN KEY (puid) REFERENCES "user"(uid);
ALTER TABLE "experiment" ALTER COLUMN eid SET NOT NULL;
ALTER TABLE "experiment" ALTER COLUMN eid ADD GENERATED ALWAYS AS IDENTITY;
ALTER TABLE "experiment" ADD PRIMARY KEY (eid);
ALTER TABLE "experiment" ADD FOREIGN KEY (uid) REFERENCES "user"(uid);
ALTER TABLE "recruitment" ADD PRIMARY KEY (rid);
ALTER TABLE "recruitment" ADD FOREIGN KEY (eid) REFERENCES "experiment"(eid) ON DELETE CASCADE;
ALTER TABLE "recruitment_condition" ADD PRIMARY KEY (rcid);
ALTER TABLE "recruitment_condition" ADD FOREIGN KEY (rid) REFERENCES "recruitment"(rid) ON DELETE CASCADE;
ALTER TABLE "recruitment_participant" ADD PRIMARY KEY (uid, rcid);
ALTER TABLE "recruitment_participant" ADD FOREIGN KEY (uid) REFERENCES "user"(uid);
ALTER TABLE "recruitment_participant" ADD FOREIGN KEY (rcid) REFERENCES "recruitment_condition"(rcid) ON DELETE CASCADE;

CREATE TABLE "users" (
	"id" serial PRIMARY KEY NOT NULL,
	"email" varchar(255) NOT NULL,
	"username" varchar(50),
	CONSTRAINT "users_email_unique" UNIQUE("email")
);

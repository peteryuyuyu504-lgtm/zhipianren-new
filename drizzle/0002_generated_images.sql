CREATE TABLE "generated_images" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" integer NOT NULL,
	"task_id" varchar(160) NOT NULL,
	"kind" varchar(32) NOT NULL,
	"prompt" text NOT NULL,
	"image_url" varchar(2048),
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "generated_images" ADD CONSTRAINT "generated_images_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;
--> statement-breakpoint
CREATE UNIQUE INDEX "generated_images_task_id_unique" ON "generated_images" USING btree ("task_id");

CREATE TABLE "performance_snapshots" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"date" timestamp NOT NULL,
	"total_pnl" numeric(20, 8) NOT NULL,
	"total_volume" numeric(20, 8) NOT NULL,
	"total_fees" numeric(20, 8) NOT NULL,
	"trade_count" numeric NOT NULL,
	"win_count" numeric NOT NULL,
	"loss_count" numeric NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "trade_annotations" (
	"id" text PRIMARY KEY NOT NULL,
	"trade_signature" text NOT NULL,
	"user_id" text NOT NULL,
	"note" text NOT NULL,
	"tags" text[],
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "trades" (
	"signature" text PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"timestamp" timestamp NOT NULL,
	"type" varchar(10) NOT NULL,
	"symbol" varchar(50) NOT NULL,
	"status" varchar(10) NOT NULL,
	"entry_price" numeric(20, 8) NOT NULL,
	"exit_price" numeric(20, 8),
	"size" numeric(20, 8) NOT NULL,
	"fee" numeric(20, 8) NOT NULL,
	"pnl" numeric(20, 8),
	"leverage" numeric(5, 2),
	"order_type" varchar(20),
	"fee_type" varchar(20),
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" text PRIMARY KEY NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"last_synced_at" timestamp
);
--> statement-breakpoint
ALTER TABLE "performance_snapshots" ADD CONSTRAINT "performance_snapshots_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "trade_annotations" ADD CONSTRAINT "trade_annotations_trade_signature_trades_signature_fk" FOREIGN KEY ("trade_signature") REFERENCES "public"."trades"("signature") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "trade_annotations" ADD CONSTRAINT "trade_annotations_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "trades" ADD CONSTRAINT "trades_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "user_date_idx" ON "performance_snapshots" USING btree ("user_id","date");--> statement-breakpoint
CREATE INDEX "user_id_idx" ON "trades" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "timestamp_idx" ON "trades" USING btree ("timestamp");--> statement-breakpoint
CREATE INDEX "symbol_idx" ON "trades" USING btree ("symbol");--> statement-breakpoint
CREATE INDEX "status_idx" ON "trades" USING btree ("status");
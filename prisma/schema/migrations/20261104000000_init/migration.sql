-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "auth_schema";

-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "campus_schema";

-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "events_schema";

-- CreateEnum
CREATE TYPE "auth_schema"."Role" AS ENUM ('INVITADO', 'ESTUDIANTE', 'DOCENTE', 'ENTRENADOR', 'MODERADOR', 'ADMIN');

-- CreateEnum
CREATE TYPE "campus_schema"."ServiceType" AS ENUM ('RESTAURANTE', 'CAFETERIA', 'BIBLIOTECA', 'ENFERMERIA', 'FOTOCOPIAS', 'PARQUEADERO', 'OFICINA');

-- CreateEnum
CREATE TYPE "events_schema"."EventCategory" AS ENUM ('ACADEMICO', 'DEPORTIVO', 'CULTURAL', 'ESTUDIANTIL', 'INSTITUCIONAL', 'BIENESTAR');

-- CreateEnum
CREATE TYPE "events_schema"."EventStatus" AS ENUM ('BORRADOR', 'PENDIENTE_APROBACION', 'PUBLICADO', 'RECHAZADO', 'CANCELADO', 'ARCHIVADO', 'REUBICACION_LOGISTICA_PENDIENTE');

-- CreateEnum
CREATE TYPE "events_schema"."AccessType" AS ENUM ('LIBRE', 'REGISTRO_PREVIO', 'EXCLUSIVO_FACULTAD');

-- CreateEnum
CREATE TYPE "events_schema"."RegistrationStatus" AS ENUM ('CONFIRMADA', 'CANCELADA');

-- CreateEnum
CREATE TYPE "events_schema"."ReportStatus" AS ENUM ('RECIBIDO', 'EN_REVISION', 'RESUELTO', 'DESESTIMADO');

-- CreateTable
CREATE TABLE "auth_schema"."users" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "password_hash" TEXT NOT NULL,
    "is_email_verified" BOOLEAN NOT NULL DEFAULT false,
    "role" "auth_schema"."Role" NOT NULL DEFAULT 'ESTUDIANTE',
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "auth_schema"."user_profiles" (
    "user_id" TEXT NOT NULL,
    "full_name" TEXT NOT NULL,
    "faculty_id" TEXT,
    "academic_program" TEXT,
    "interests" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "avatar_url" TEXT,
    "is_authorized_organizer" BOOLEAN NOT NULL DEFAULT false,
    "habeas_data_accepted_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "user_profiles_pkey" PRIMARY KEY ("user_id")
);

-- CreateTable
CREATE TABLE "auth_schema"."audit_logs" (
    "id" TEXT NOT NULL,
    "actor_id" TEXT,
    "action" TEXT NOT NULL,
    "target_entity" TEXT NOT NULL,
    "target_id" TEXT NOT NULL,
    "payload" JSONB,
    "ip_address" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "audit_logs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "campus_schema"."universities" (
    "id" TEXT NOT NULL DEFAULT 'ECI',
    "name" TEXT NOT NULL DEFAULT 'Escuela Colombiana de Ingeniería Julio Garavito',

    CONSTRAINT "universities_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "campus_schema"."faculties" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "hex_color" TEXT NOT NULL DEFAULT '#8B0000',
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "faculties_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "campus_schema"."buildings" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "svg_element_id" TEXT NOT NULL,
    "image_url" TEXT,
    "floors_count" INTEGER NOT NULL DEFAULT 1,
    "academic_info" TEXT,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "university_id" TEXT NOT NULL DEFAULT 'ECI',

    CONSTRAINT "buildings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "campus_schema"."campus_places" (
    "id" TEXT NOT NULL,
    "building_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "floor" TEXT NOT NULL,
    "max_physical_capacity" INTEGER NOT NULL DEFAULT 30,
    "is_active" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "campus_places_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "campus_schema"."sports_facilities" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "sport_types" TEXT[],
    "svg_element_id" TEXT NOT NULL,
    "is_active" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "sports_facilities_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "campus_schema"."campus_services" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "service_type" "campus_schema"."ServiceType" NOT NULL,
    "operating_hours" TEXT,
    "phone" TEXT,
    "building_id" TEXT NOT NULL,

    CONSTRAINT "campus_services_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "events_schema"."events" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "category" "events_schema"."EventCategory" NOT NULL,
    "faculty_id" TEXT,
    "organizer_id" TEXT NOT NULL,
    "organizer_name" TEXT NOT NULL,
    "building_id" TEXT NOT NULL,
    "specific_location" TEXT NOT NULL,
    "start_time" TIMESTAMP(3) NOT NULL,
    "end_time" TIMESTAMP(3) NOT NULL,
    "original_end_time" TIMESTAMP(3) NOT NULL,
    "status" "events_schema"."EventStatus" NOT NULL DEFAULT 'PENDIENTE_APROBACION',
    "access_type" "events_schema"."AccessType" NOT NULL DEFAULT 'LIBRE',
    "price" DECIMAL(10,2) NOT NULL DEFAULT 0.00,
    "is_public" BOOLEAN NOT NULL DEFAULT true,
    "requires_registration" BOOLEAN NOT NULL DEFAULT false,
    "max_capacity" INTEGER,
    "available_capacity" INTEGER,
    "image_url" TEXT,
    "rejection_reason" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "events_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "events_schema"."event_registrations" (
    "id" TEXT NOT NULL,
    "event_id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "registered_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "cancelled_at" TIMESTAMP(3),
    "status" "events_schema"."RegistrationStatus" NOT NULL DEFAULT 'CONFIRMADA',

    CONSTRAINT "event_registrations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "events_schema"."event_reports" (
    "id" TEXT NOT NULL,
    "event_id" TEXT NOT NULL,
    "reporter_user_id" TEXT NOT NULL,
    "reason" TEXT NOT NULL,
    "description" TEXT,
    "status" "events_schema"."ReportStatus" NOT NULL DEFAULT 'RECIBIDO',
    "reviewed_by" TEXT,
    "reviewed_at" TIMESTAMP(3),
    "resolution_notes" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "event_reports_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "events_schema"."event_favorites" (
    "id" TEXT NOT NULL,
    "event_id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "event_favorites_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "auth_schema"."users"("email");

-- CreateIndex
CREATE INDEX "audit_logs_actor_id_created_at_idx" ON "auth_schema"."audit_logs"("actor_id", "created_at");

-- CreateIndex
CREATE INDEX "audit_logs_target_entity_target_id_idx" ON "auth_schema"."audit_logs"("target_entity", "target_id");

-- CreateIndex
CREATE UNIQUE INDEX "faculties_name_key" ON "campus_schema"."faculties"("name");

-- CreateIndex
CREATE UNIQUE INDEX "faculties_slug_key" ON "campus_schema"."faculties"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "buildings_code_key" ON "campus_schema"."buildings"("code");

-- CreateIndex
CREATE UNIQUE INDEX "buildings_svg_element_id_key" ON "campus_schema"."buildings"("svg_element_id");

-- CreateIndex
CREATE INDEX "campus_places_building_id_idx" ON "campus_schema"."campus_places"("building_id");

-- CreateIndex
CREATE UNIQUE INDEX "sports_facilities_code_key" ON "campus_schema"."sports_facilities"("code");

-- CreateIndex
CREATE UNIQUE INDEX "sports_facilities_svg_element_id_key" ON "campus_schema"."sports_facilities"("svg_element_id");

-- CreateIndex
CREATE INDEX "campus_services_building_id_idx" ON "campus_schema"."campus_services"("building_id");

-- CreateIndex
CREATE INDEX "events_status_start_time_end_time_idx" ON "events_schema"."events"("status", "start_time", "end_time");

-- CreateIndex
CREATE INDEX "events_building_id_status_idx" ON "events_schema"."events"("building_id", "status");

-- CreateIndex
CREATE INDEX "events_faculty_id_status_idx" ON "events_schema"."events"("faculty_id", "status");

-- CreateIndex
CREATE INDEX "event_registrations_user_id_status_idx" ON "events_schema"."event_registrations"("user_id", "status");

-- CreateIndex
CREATE UNIQUE INDEX "event_registrations_event_id_user_id_key" ON "events_schema"."event_registrations"("event_id", "user_id");

-- CreateIndex
CREATE INDEX "event_reports_status_idx" ON "events_schema"."event_reports"("status");

-- CreateIndex
CREATE UNIQUE INDEX "event_reports_event_id_reporter_user_id_key" ON "events_schema"."event_reports"("event_id", "reporter_user_id");

-- CreateIndex
CREATE INDEX "event_favorites_user_id_idx" ON "events_schema"."event_favorites"("user_id");

-- CreateIndex
CREATE UNIQUE INDEX "event_favorites_event_id_user_id_key" ON "events_schema"."event_favorites"("event_id", "user_id");

-- AddForeignKey
ALTER TABLE "auth_schema"."user_profiles" ADD CONSTRAINT "user_profiles_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth_schema"."users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "auth_schema"."audit_logs" ADD CONSTRAINT "audit_logs_actor_id_fkey" FOREIGN KEY ("actor_id") REFERENCES "auth_schema"."users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "campus_schema"."buildings" ADD CONSTRAINT "buildings_university_id_fkey" FOREIGN KEY ("university_id") REFERENCES "campus_schema"."universities"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "campus_schema"."campus_places" ADD CONSTRAINT "campus_places_building_id_fkey" FOREIGN KEY ("building_id") REFERENCES "campus_schema"."buildings"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "campus_schema"."campus_services" ADD CONSTRAINT "campus_services_building_id_fkey" FOREIGN KEY ("building_id") REFERENCES "campus_schema"."buildings"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "events_schema"."event_registrations" ADD CONSTRAINT "event_registrations_event_id_fkey" FOREIGN KEY ("event_id") REFERENCES "events_schema"."events"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "events_schema"."event_reports" ADD CONSTRAINT "event_reports_event_id_fkey" FOREIGN KEY ("event_id") REFERENCES "events_schema"."events"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "events_schema"."event_favorites" ADD CONSTRAINT "event_favorites_event_id_fkey" FOREIGN KEY ("event_id") REFERENCES "events_schema"."events"("id") ON DELETE CASCADE ON UPDATE CASCADE;


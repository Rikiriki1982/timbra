#!/usr/bin/env bash
# Prova supabase/setup.sql su un PostgreSQL vuoto: installazione, seconda esecuzione (deve essere innocua)
# e prove delle regole. Uso: PGHOST=... PGPORT=... PGUSER=... bash tests/db/prova-database.sh
set -euo pipefail
cd "$(dirname "$0")/../.."
DB=timbra_prova
psql -q -v ON_ERROR_STOP=1 -d postgres -c "drop database if exists $DB" -c "create database $DB"
P="psql -q -v ON_ERROR_STOP=1 -d $DB"
$P -f tests/db/supabase-finto.sql >/dev/null
# pg_net e pg_cron esistono solo su Supabase: qui li sostituisce supabase-finto.sql
sed -E 's/^create extension if not exists pg_(net|cron);/-- &/' supabase/setup.sql > /tmp/setup-prova.sql
echo "1/3 installazione su database vuoto";  $P -f /tmp/setup-prova.sql >/dev/null
echo "2/3 seconda esecuzione (non deve dare errori)"; $P -f /tmp/setup-prova.sql >/dev/null
echo "3/3 prove delle regole"; $P -f tests/db/prove-regole.sql

#!/usr/bin/env python3
"""Post-processa o bundle consolidado pra torná-lo idempotente.

Prefixa DROP...IF EXISTS antes de CREATE INDEX/TRIGGER/POLICY e
ALTER TABLE ADD CONSTRAINT, baseado em regex. Pensado para ser rodado
depois de scripts/build-migrations-sql.sh.

Lê stdin, escreve stdout.
"""
import re
import sys

src = sys.stdin.read()

# 1. CREATE INDEX ... → CREATE INDEX IF NOT EXISTS
#    Cobre os casos com e sem schema qualifier e índices parciais (WHERE ...).
src = re.sub(
    r'(?mi)^CREATE\s+(UNIQUE\s+)?INDEX\s+(?!IF\s+NOT\s+EXISTS)([A-Za-z_][\w]*)',
    lambda m: f'CREATE {m.group(1) or ""}INDEX IF NOT EXISTS {m.group(2)}',
    src,
)

# 2. CREATE TRIGGER <name> ... ON <table>  →  DROP TRIGGER IF EXISTS <name> ON <table>; CREATE TRIGGER ...
#    Multi-line: o ON <table> geralmente está nas próximas linhas. DOTALL.
def wrap_trigger(match):
    full = match.group(0)
    name = match.group(1)
    table = match.group(2)
    return f'DROP TRIGGER IF EXISTS {name} ON {table};\n{full}'

src = re.sub(
    r'(?mis)^CREATE\s+TRIGGER\s+([A-Za-z_][\w]*)\s+[^;]*?\s+ON\s+([A-Za-z_][\w.]*)',
    wrap_trigger,
    src,
)

# 3. CREATE POLICY "<name>" ON <table>  →  DROP POLICY IF EXISTS "<name>" ON <table>; CREATE POLICY ...
#    Também aceita identificador sem aspas.
def wrap_policy(match):
    full = match.group(0)
    name = match.group(1)
    table = match.group(2)
    return f'DROP POLICY IF EXISTS {name} ON {table};\n{full}'

src = re.sub(
    r'(?mis)^CREATE\s+POLICY\s+("[^"]+"|[A-Za-z_][\w]*)\s*\n?\s*ON\s+([A-Za-z_][\w.]*)',
    wrap_policy,
    src,
)

# 3b. CREATE TABLE <name> → CREATE TABLE IF NOT EXISTS <name>.
src = re.sub(
    r'(?mi)^CREATE\s+TABLE\s+(?!IF\s+NOT\s+EXISTS)([A-Za-z_][\w.]*)',
    lambda m: f'CREATE TABLE IF NOT EXISTS {m.group(1)}',
    src,
)

# 4. ALTER TABLE <tbl> ADD CONSTRAINT <name>  → precede com DROP CONSTRAINT IF EXISTS.
def wrap_constraint(match):
    full = match.group(0)
    table = match.group(1)
    name = match.group(2)
    return f'ALTER TABLE {table} DROP CONSTRAINT IF EXISTS {name};\n{full}'

src = re.sub(
    r'(?mi)^ALTER\s+TABLE\s+([A-Za-z_][\w.]*)\s+ADD\s+CONSTRAINT\s+([A-Za-z_][\w]*)',
    wrap_constraint,
    src,
)

sys.stdout.write(src)

#! /usr/bin/env bash

set -e
set -x

R_HOME="/usr/bin/R"
export R_HOME

R_LIBS="/usr/lib/R"
export R_LIBS

# Let the DB start
#python app/backend_pre_start.py

# Run migrations
#alembic upgrade head

# Create initial data in DB
#python app/initial_data.py
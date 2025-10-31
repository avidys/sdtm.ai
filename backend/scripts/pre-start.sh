#! /usr/bin/env bash

set -e
set -x

#./configure --prefix=$HOME/R
#echo "R_HOME: $R_HOME"
#echo "R_LIBS: $R_LIBS"
#echo "LD_PRELOAD: $LD_PRELOAD"
#echo "LD_LIBRARY_PATH: $LD_LIBRARY_PATH"

#export R_HOME="/usr/bin/R"
#export R_LIBS="/usr/lib/R"

#which Rscript
find / -name libR.so 2>/dev/null

# Let the DB start
#python app/backend_pre_start.py

# Run migrations
#alembic upgrade head

# Create initial data in DB
#python app/initial_data.py

# {
#   "steps": {
#     "setup": {
#       "commands": [
#         "echo 'Starting setup phase...'",
#         "echo 'Installing dependencies...'",
#         "npm install",
#         "echo 'Setup phase complete.'"
#       ]
#     }
#   }
# }

#LD_PRELOAD=/path/to/your/lib/libR.so
#LD_LIBRARY_PATH=/path/to/your/lib:$LD_LIBRARY_PATH
#export LD_LIBRARY_PATH=/path/to/library:$LD_LIBRARY_PATH


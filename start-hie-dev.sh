#!/bin/bash

if [ -n "$1" ]; then
    docker compose -f hie/docker/docker-compose-dev.yml $@
else
    docker compose -f hie/docker/docker-compose-dev.yml up -d --force-recreate
fi
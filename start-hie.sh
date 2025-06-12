#!/bin/bash
docker network inspect hie >/dev/null 2>&1 || docker network create hie

if [ -n "$1" ]; then
    docker compose -f hie/docker-compose.yml -f proxy/docker-compose.yml $@
else
    docker compose -f hie/docker-compose.yml -f proxy/docker-compose.yml up -d --force-recreate
fi
#!/bin/bash

# Script pour tuer les processus sur les ports 8080-8082

if command -v lsof &> /dev/null; then
    echo "Utilisation de lsof..."
    for port in {8080..8082}; do
        pids=$(lsof -ti:$port 2>/dev/null)
        if [ ! -z "$pids" ]; then
            for pid in $pids; do
                echo "  Port $port: Tué PID $pid"
                kill -9 $pid 2>/dev/null
            done
        fi
    done
else
    echo "lsof non disponible, utilisation de netstat..."
    for port in {8080..8082}; do
        pid=$(netstat -tulpn 2>/dev/null | grep ":$port" | awk '{print $7}' | cut -d'/' -f1)
        if [ ! -z "$pid" ] && [ "$pid" != "" ]; then
            echo "  Port $port: Tué PID $pid"
            kill -9 $pid 2>/dev/null
        fi
    done
fi

echo "Ports 8080-8082 nettoyés"

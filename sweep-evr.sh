#!/bin/bash

while getopts m: flag
do
    case "${flag}" in
        m) mode=${OPTARG};;
    esac
done

if ! [[ $mode == simulation || $mode == sweep ]]; then
    echo "The flag value for -m MUST be either simulation or sweep, no other value allowed."
    echo "Simulation will run all operations EXCEPT actually making the sweep. Use it to see what will happen."
    exit 1
elif [[ $mode == simulation ]]; then
    echo "****"
    echo "Running SIMULATION (no EVR being moved!)"
    echo "****"
    node index.js $mode
    exit 0
elif [[ $mode == sweep ]]; then
    echo "Running SWEEP, this will move EVR to your main wallet!"
    echo "****"
    read -r -p "Are you sure you want to continue? [y/N] " response
    response=${response,,}
    if [[ "$response" =~ ^(yes|y)$ ]]; then
        echo "Confirmed... running SWEEP of Evernode nodes wallets."
        node index.js $mode
        exit 0
    else
        echo "Aborting..."
        exit 1
    fi
fi
exit 1
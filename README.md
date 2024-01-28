# xahl-evr-sweeper

Script to make bulk transfers of Evernode (EVR) from host nodes addresses to a main wallet.  
- Currently works for XAHL MAINNET, and can do a simulated payment as a dry-run.
- Creates a timestamped .csv in the log directory of each run for easy review.
- Input is simple single column .csv of addresses (see nodes.csv for working example, replace with your node addresses).
- Script only works with ONE secret, so the recommended procedure is to create account and set that account as the regular key on ALL nodes addresses (see below).

Tested with NodeJS v.20.9.0.

**********
AN IMPORTANT NOTE!
- DO NOT use your main wallet family secret, create a specific wallet address as the regular key and use the 'evernode' command to apply that key all all your node addresses.
- DO NOT leak this key!
- The author is NOT responsible for what you do with this software! 
- If your key leaks or you use this software to send EVR to addresses you don't own, you WILL lose your funds!

Recommended procedure:

1. Create a new Xahau account in Xaman, taking care to keep your secret numbers safe, but DO NOT activate this account. You don't need it activated. Note the public address.
2. See below for how to get your family secret from your secret numbers, as Xaman WILL NOT provide this directly. Note the warning.
3. Once you have your family secret, add it to SEED_MAINNET in .env.
4. On EACH Evernode host, run the following (I found it most reliable to do this as root, and not using sudo):
   
    `evernode regkey set <your-newly-created-public-address>`

What you have just done is set this unactivated account as the signing account for your nodes (one account to rule them all).

Note that Xaman (formerly Xumm) will not show your family seed at any point.  To get the seed, you can use WietseWind's excellent repo:

```
https://github.com/WietseWind/secret-numbers-to-family-seed
```

Please DO NOT run this online. I recommend you set up a VM with a clean linux Desktop OS, install the repo and dependencies, then take it OFFLINE and run it on localhost.
I had to switch to NodeJS v.16.x (Gallium) to get it to run.  PROCEED AT YOUR OWN RISK!
**********

To install:

```
git clone https://github.com/go140point6/xahl-evr-sweeper
cd xahl-evr-sweeper
chmod +x sweep-evr.sh
npm install
```

To run:

Copy the .env-template file as .env and add your specific information. Add your node addresses to nodes.csv (removing the samples).

```
./sweep-evr.sh -m [mode]

./sweep-evr.sh -m simulation
./sweep-evr.sh -m sweep
```

Simulation - Run entire sequence only omitting the "client.submitAndWait(signed.tx_blob)" process. Review output and .csv to see what final output will be.

Sweep - The real deal.  When ready, ensure the data/nodes.csv contains the real addresses you want sweep from and that your main wallet is correctly added to .env as MAIN_WALLET.
require('dotenv').config();
require('log-timestamp');
const xrpl = require("xrpl");
const fs = require('fs')
const { parse } = require('csv-parse');

var mode = process.argv[2]
var timestamp

addressesToCollect = []

function logToFile(data) {
  const now = new Date();
  timestamp = `${now.toISOString()}`;

  // Append to file
  fs.appendFile(`log/${mode}-evr-collect.csv`, `${timestamp}${data}\n`, function (err) {
  if (err) throw err;
  })  
}

const createArray = new Promise((resolve, reject) => {
  fs.createReadStream("data/nodes.csv")
  .pipe(parse({ delimiter: ",", from_line: 1 }))
  .on("data", function (row) {
      addressesToCollect.push([row[0]]) 
  })
  .on("end", function() {
      resolve(addressesToCollect)
  })
  .on("error", function(err) {
      reject(err)
  })
})

async function main() {
  try {
    try {
      seed = xrpl.Wallet.fromSeed(process.env.SEED_MAINNET)
      wallet = process.env.MAIN_WALLET
      console.log(`Your main wallet to receive your EVR is ${wallet}.`)
      console.log('')
    } catch(err) {
      console.log("Family seed likely incorrect, please check. Error:", err.message)
      process.exit(1)
    }

    const client = new xrpl.Client(process.env.WS_MAINNET)
    await client.connect()
    fs.appendFile(`log/${mode}-evr-collect.csv`, 'Timestamp,AmountSent,SourceAddress,DestinationAddress,Fee,Hash\n', (err) => {
      if (err) throw err;
    })

    for (const arrayAddress of addressesToCollect) {
        var balance = await client.request({
              command: "account_lines",
              account: arrayAddress.toString(),
              ledger_index: "validated",
        })

        const evrBalanceOnly = balance.result.lines.find(line => line.account === process.env.ISSUING_ADDR)

        if (!evrBalanceOnly || parseFloat(evrBalanceOnly.balance) <= 0) {
          console.log(`${arrayAddress} currently does not appear to have a trustline for EVR or has a zero balance.`)
          logToFile(`,${evrBalanceOnly.balance},${arrayAddress},null,null,'no trustline or zero balance.'`)
          console.log('')
          continue
        } else {
          console.log(`${arrayAddress} currently has ${evrBalanceOnly.balance} EVR.`)
        }

        var prepared = await client.autofill({
          TransactionType: "Payment",
          Account: arrayAddress.toString(),
          Amount: {
            "value": evrBalanceOnly.balance,
            "currency": process.env.CURRENCY_CODE,
            "issuer": process.env.ISSUING_ADDR
          },
          Destination: wallet,
        })

        //const max_ledger = prepared.LastLedgerSequence

        //console.log("Prepared transaction instructions:", prepared);
        console.log(`Sending ${evrBalanceOnly.balance} EVR to ${prepared.Destination} from ${prepared.Account} at a fee of ${xrpl.dropsToXrp(prepared.Fee)} XAH\n`);

        // Sign prepared instructions ------------------------------------------------
        var signed = await seed.sign(prepared);
        //console.log("Identifying hash:", signed.hash)
        //console.log("Signed blob:", signed.tx_blob)

        // Submit signed blob --------------------------------------------------------
        if ( mode == 'sweep' ) {
          var tx = await client.submitAndWait(signed.tx_blob);
          // Check transaction results -------------------------------------------------
          let txResult = tx.result.meta.TransactionResult
          console.log("Transaction result:", txResult);
          if ( tx.result.meta.TransactionResult !== 'tesSUCCESS') {
              console.log(`Something wrong, non-success message of ${txResult} returned from TX`)
              await client.disconnect()
              process.exit(1)
          } else {
              console.log(`Success sending ${prepared.Amount.value} EVR to ${prepared.Destination} from ${prepared.Account} at a fee of ${xrpl.dropsToXrp(prepared.Fee)} XAH `)
              logToFile(`,${prepared.Amount.value},${prepared.Account},${prepared.Destination},${xrpl.dropsToXrp(prepared.Fee)},${signed.hash}`)
          }
        } else {
          console.log("Simulating the submitAndWait function")
          console.log(`Simulated sending ${prepared.Amount.value} EVR to ${prepared.Destination} from ${prepared.Account} at a fee of ${xrpl.dropsToXrp(prepared.Fee)} XAH`)
          console.log('')
          logToFile(`,${prepared.Amount.value},${prepared.Account},${prepared.Destination},${xrpl.dropsToXrp(prepared.Fee)},null`)
          }
      }

      // Disconnect ----------------------------------------------------------------
      fs.rename(`log/${mode}-evr-collect.csv`, `log/${mode}-evr-collect-${timestamp}.csv`, (err) => {
        if (err) throw err;
      })
      await client.disconnect();
    } catch (error) {
      console.error(error);
    }
  }

createArray.then(() => {
  main()
}).catch((err) => {
  console.error(err)
})
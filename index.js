const express = require('express');
const morgan = require('morgan');
const colors = require('colors');


const app = express();

app.use(morgan('dev'));
app.use(express.json());

app.post('/fees', (req, res) => {

    try {

        if( req.body.FeeConfigurationSpec != null)
        {
            const FeeConfigurationSpec = req.body.FeeConfigurationSpec;

            const FeeConfigurationSpecArray = FeeConfigurationSpec.split('\n');
            console.log(`${FeeConfigurationSpec}`.blue);
            for (const fee in FeeConfigurationSpecArray) {
              //FeeConfigurationSpecArray[fee].strip(':');
              const FeeArray = FeeConfigurationSpecArray[fee].split(' : ');

            const feeNum = Number(fee);

              console.log(`Item  ${feeNum + 1} \n Fee Description: ${FeeArray[0]} \n Fee Charge: ${FeeArray[1]}`              )

            }
         // console.log(`${FeeConfigurationSpecArray}`.bgYellow.red)

            res.status(200).json({
                "status" : "ok"
            })
        }


        else{
            res.status(501).json({
                "status" : "Error!",
                "message" : "Provide  Fee Configuration Spec"
            })
        }


    } catch (error) {
        res.status(500).json({
            "status" : 'Error!',
            "message" : error.message
        })
    }


});

const PORT = 4000;

app.listen(PORT, () => {
    console.log(`App listening on port: ${4000}!`.bgGreen.black);
});

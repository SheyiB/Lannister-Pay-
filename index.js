const express = require('express');
const morgan = require('morgan');
const colors = require('colors');
const mongoose = require('mongoose');
const FeeModel = require('./model');
const { count } = require('./model');


//Connect to Mongoose
mongoose.connect('mongodb:localhost//lanisterpay'
, (err)=> {
    if(err){
        console.log(`Database could not connect because of error : ${err.message}`)
    }
    else{
        console.log('Database Connected');
    }
})

const app = express();

app.use(morgan('dev'));
app.use(express.json());

app.post('/fees', async (req, res) => {

    try {

        if( req.body.FeeConfigurationSpec != null)
        {
        const FeeConfigurationSpec = req.body.FeeConfigurationSpec;

        const FeeConfigurationSpecArray = FeeConfigurationSpec.split('\n');

        for (const fee in FeeConfigurationSpecArray) {

            const FeeArray = FeeConfigurationSpecArray[fee].split(' : ');
            const sect1 = FeeArray[0].toString();
            const sect11 = sect1.split(" ");
            const sect2 = FeeArray[1].toString();
            const sect22 = sect2.split(" ");
            const feeNum = Number(fee);

        const FeeID = sect11[0];
        const FeeCurrency = sect11[1];
        const FeeLocale = sect11[2];
        let FeeEntityArray = sect11[3];
        FeeEntityArray = FeeEntityArray.toString();
        FeeEntityArray = FeeEntityArray.replace('(', " ");
        FeeEntityArray = FeeEntityArray.replace(')', " ");
        FeeEntityArray = FeeEntityArray.split(" ");
        const FeeEntity = FeeEntityArray[0];
        const EntityPpty = FeeEntityArray[1];

        const FeeType = sect22[1];
        const FeeValue = sect22[2];

        const feesave = await FeeModel.create({FeeID, FeeCurrency, FeeLocale, FeeEntity, EntityPpty, FeeType, FeeValue});

        var specificity = 0;

        const feed = [
            FeeLocale ,FeeEntity ,EntityPpty];

        for (const i in feed){
            if (feed[i] != '*'){
                specificity = specificity + 1
            }
        }
            }
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


app.post('/compute-transaction-fee', async (req, res) =>  {

    try {
        let feelocale = "";
    let feeentity = "";
    let entitytype1 = "";
    let entitytype2 = "";

    //Set Locality
    if(req.body.Currency == "NGN" && req.body.CurrencyCountry == "NG"){
        feelocale = "LOCL"
    }
    else if(req.body.Currency == "NGN" && req.body.CurrencyCountry !== "NG"){
        feelocale = "INTL"
    }
    else{
        res.status(403).json({
            "Error": `No fee configuration for ${req.body.Currency} transactions`

        });
    }

    //Set payment Type
    if(req.body.PaymentEntity.Type != null){
        feeentity = req.body.PaymentEntity.Type;
    }

    //Set Entity Type
    if(req.body.issuer != null | req.body.brand != null){
        entitytype1 = req.body.issuer;
        entitytype2 = req.body.brand;
    }

    const loc = feelocale;
    const ent = feeentity ;
    async function det  (loc, ent, entitytype1, entitytype2) {
        let feetype = await FeeModel.find({$and:[{FeeLocale: {$in : [loc, "*"]}}, {FeeEntity:  {$in : [ent, "*"]}}, {EntityPpty:  {$in : [entitytype1, entitytype2, "*"]}}]});


        if(feetype.length > 1){
            const arraye = []
            for(let i in feetype){
                i = Number(i)
                let distu = [feetype[i].FeeID, feetype[i].FeeCurrency, feetype[i].FeeLocale, feetype[i].FeeEntity, feetype[i].EntityPpty, feetype[i].FeeType, feetype[i].FeeValue]
                arraye.push(distu)

        }

        for(let a in arraye){
            a= Number(a)
            let spec = arraye[a].filter(x => x=='*').length
            arraye[a].push(spec)

        }

            let arr = []

            for(let k in arraye){

                k = Number(k)
                if (arr == ''){

                    arr = arraye[k]
                }
                if ( arraye[k][7] < arr[7]){

                    arr = arraye[k]
                }
            }

            feetype = {
                FeeID : arr[0] ,
                FeeCurrency: arr[1],
                FeeLocale: arr[2] ,
                FeeEntity: arr[3] ,
                EntityPpty: arr[4],
                FeeType: arr[5],
                FeeValue:  arr[6]
            }


        }

        else{
            feetype = feetype[0];
        }

        return feetype
    }

    let feetype = await det(loc,ent,entitytype1, entitytype2);

   function determine(feetype){


        if(feetype.FeeType == 'FLAT'){

            let price = feetype.FeeValue;
            return price
        }
        else if(feetype.FeeType == 'PERC'){

            let price = (Number(feetype.FeeValue) * req.body.Amount)/100;
            return price
        }
        else if(feetype.FeeType == 'FLAT_PERC'){

            const flat = Number(feetype.FeeValue.toString().split(':')[0]);
            const perc = Number(feetype.FeeValue.toString().split(':')[1]);
            const percCharge = (perc * req.body.Amount)/100
            let price = flat + ((req.body.Amount * perc)/100);
            return price
        }


}

    const price = determine(feetype);
    let chargedAmount = 0;
    let SettlementAmount = 0;
    if(req.body.Customer.BearsFee == false){
        chargedAmount = req.body.Amount;
        SettlementAmount = req.body.Amount - price
    }
    else{
        chargedAmount = price + req.body.Amount;
        SettlementAmount = req.body.Amount
    }


    res.status(200).json({
        "AppliedFeeID": feetype.FeeID,
        "AppliedFeeValue": price,
        "ChargeAmount": chargedAmount,
        "SettlementAmount": SettlementAmount

    });
    } catch (error) {
        return  error.message
    }

})
const PORT = process.env.PORT || 4000;

app.listen(PORT, () => {
    console.log(`App listening on port: ${4000}!`.bgGreen.black);
});

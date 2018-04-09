var express = require('express');
var app = express();
var request = require('request');
var mysql = require('mysql');
var moment = require('moment');
var Promise = require("bluebird");
var getSqlConnection = require('./databaseConnection');

//NDF01----------------->No Data For selected Date Range
//NDF02----------------->No Block Configured
//NDF03----------------->No Block Name

//*********************************************DataBase Connection****************************************************//
var connection = mysql.createConnection({
    host: 'localhost',
    user: 'root',
    database : 'we2db',                                     //For Production
});
connection.connect();
//***********************************************Invoice Generation Code Begins Here**********************************//
app.get('/', function (req, res) {
    var id = req.query.s_id;
    var aprt_id = req.query.aprt_id;
    console.log("Apartment ID");
    console.log(aprt_id);
    var month_start_date = moment().subtract(1, 'months').startOf('month');
    var month_end_date = moment().subtract(1, 'months').endOf('month');
//***********************************************From and To date*****************************************************//
    var date_from_to = [];
    date_from_to.push
    ({
        from_date: moment(month_start_date).format('MM/DD/YYYY'),
        from_date_db: moment(month_start_date).format('YYYY-MM-DD'),
        to_date: moment(month_end_date).format('MM/DD/YYYY')
    });
    date_from_to = date_from_to[0];
    console.log("From Date & To Date");
    console.log(date_from_to);
//************************************************User Details********************************************************//
    var sql = 'SELECT * FROM  `w2_site_qa1` where site_id="' + id + '"';
    connection.query(sql, function (err, result) {
        if (err) {
            res.send('ERORR!!!!!!!!!!!!');
        }
        else {
            var user = [];
            user = result;
        }
        user = user[0];
//************************************************Apartment id to get Block Id****************************************//
         sql = 'SELECT  `block_id` FROM `w2_apart_master` WHERE `id`="' + aprt_id + '"';
        connection.query(sql, function (err, result) {
            if(result!='') {
                if (err) {
                    res.send('ERORR1!!!!!!!!!!!!');
                } else {
                    var b_id = [];
                    b_id = result;
                }
                b_id = b_id[0].block_id;
                console.log("Block_id");
                console.log(b_id);
//************************************************Getting Block Name**************************************************//
             sql = 'SELECT `block_name` FROM `w2_block` where id="' + b_id + '"';
            connection.query(sql, function (err, result) {
                if (err) {
                    res.send('ERORR2!!!!!!!!!!!!');
                } else {

                    var blk_name = [];
                    blk_name = result[0];
                }
                var tenant_array = [];
                var tenant_detail_array = [];
                tenant_array = "Tenant Name";
                tenant_detail_array.push({Name: tenant_array, block_name: blk_name.block_name});
                tenant_detail_array = tenant_detail_array[0];
                console.log(tenant_detail_array);
                console.log("555555555");
                console.log(date_from_to.from_date);
//************************************************Getting Apartment Name**********************************************//
                 sql = 'SELECT `cust_name` FROM `w2_apart_master` WHERE `id`="' + aprt_id + '"';
                connection.query(sql, function (err, result) {
                    if (err) {
                        res.send('ERORR3!!!!!!!!!!!!');
                    } else {

                        var aprt_name = [];
                        aprt_name = result[0];
                    }
//************************************************Bill Invoice No*****************************************************//
                     sql = 'SELECT `id` FROM `w2_bill_master` ORDER BY id DESC LIMIT 1';
                    connection.query(sql, function (err, result) {
                        if (err) {
                            res.send('ERORR7!!!!!!!!!!!!');
                        } else {
                            var previousBillId = [];
                            previousBillId = result[0].id;
                        }
                        var currentBillId = previousBillId + 1;
                        console.log("Previous ID");
                        console.log(previousBillId);
                        console.log("Current ID");
                        console.log(currentBillId);
//************************************************Charges*************************************************************//
                         sql = 'SELECT * FROM  `w2_maintanance_costs` where site_id="' + id + '" order by id desc limit 1';
                        connection.query(sql, function (err, result) {
                            if (err) {
                                res.send('ERORR4!!!!!!!!!!!!');
                            } else {

                                var charges = [];
                                charges = result;
                            }

                            var maintenance_charge_array = [];
                            var service_charge_array = [];
                            var total_charge_array = [];
                            var tot;

                            for (c in charges) {
                                console.log("--");
                                console.log(charges[c]);
                                maintenance_charge_array.push(charges[c].fc_cost);
                                service_charge_array.push(charges[c].fc_tax);
                                tot = parseFloat((charges[c].fc_cost + charges[c].fc_tax).toFixed(2));
                                total_charge_array.push(tot);
                                console.log("@@@@");
                                console.log(tot);
                            }
//************************************************Previous month bill Cost********************************************//
                             sql = 'CALL `sa_pre_ltr_cost` ("' + aprt_id + '")';
                            connection.query(sql, function (err, result) {
                                var prebill = [];
                                if(result[0]=='') {
                                    prebill.push({
                                        month_total: 0,
                                        amount: 0
                                    });
                                } else {
                                    if (err) {
                                        res.send('ERORR IN Getting Previous Bill Data');
                                    } else {
                                        var prebill = [];
                                        prebill = result[0];
                                    }
                                }
                                var pre_mon_ltr = prebill[0].month_total;
                                var pre_mon_cost= prebill[0].amount;
//************************************************Previous Month Consumption in ltr***********************************//
                                 sql = 'CALL `comp_sum_for_month_apart` ("' + aprt_id + '","2")';
                                connection.query(sql, function (err, result) {
                                    if(result!='')
                                    {
                                        if (err) {
                                            res.send('ERORR in Getting Opening Reading..');
                                        } else {
                                            var pre_master = [];
                                            pre_master = result;
                                        }
                                        pre_master = pre_master[0];
                                    } else
                                    {
                                        res.send("NDF_NO_Previous_Month_Data");
                                    }
//************************************************Consumption Details*************************************************//
                                     sql = 'CALL `comp_sum_for_month_apart` ("' + aprt_id + '","1")';
                                    connection.query(sql, function (err, result) {
                                        console.log("Consumption");
                                        console.log(result);
                                        if(result[0]!='') {
                                            if (err) {
                                                res.send('ERORR5!!!!!!!!!!!!');
                                            } else {
                                                var master = [];
                                                master = result;
                                            }
                                            master = master[0];

                                         sql = 'SELECT * FROM  `w2_water_type_cpl` where month(dt) = month (curdate()) AND site_id="' + id + '" AND billing_water_type_id="1" order by id desc limit 1';
                                        connection.query(sql, function (err, result) {
                                            if (err) {
                                                res.send('ERORR6!!!!!!!!!!!!');
                                            } else {
                                                var ltr = [];
                                                ltr = result;
                                            }
                                            var cust_nme_array = [];
                                            var month_total_array = [];
                                            var amount_array = [];
                                            var cumulative_array = [];
                                            var pre_cumulative_array = [];
                                            var slabRateLitreFrom = [];
                                            var slabRateLitreTo = [];
                                            var slabRateCost = [];
                                            var slabRateCPL = [];
                                            var slabRateSplitUpArray = [];
                                            var slabRateArrayBuilder = [];

                                            for (i in master) {
                                                console.log("--");
                                                console.log(master[i]);
                                                cust_nme_array.push(master[i].cust_name);
                                                month_total_array.push(parseInt(master[i].month_total));
                                                cumulative_array.push(parseInt(master[i].cumulative));
                                            }

                                            for (i in pre_master) {
                                                console.log("--PreMaster--");
                                                console.log(pre_master[i]);
                                                pre_cumulative_array.push(parseInt(pre_master[i].month_total));
                                            }
//***********************************************Adding Value for Closing Reading*************************************//
                                            var closingReading = [];
                                            for(i in pre_cumulative_array)
                                            {
                                                closingReading.push(pre_cumulative_array[i]+month_total_array[i]);
                                            }
                                            console.log("Closing Reading");
                                            console.log(closingReading);

                                            var cost = 0;
                                            var monthTotalArrayAdded = 0;
                                            for (v in month_total_array) {
                                                monthTotalArrayAdded = monthTotalArrayAdded + month_total_array[v];
                                            }
                                            console.log("Added Month Total");
                                            console.log(monthTotalArrayAdded);
//*******************************************Slab Rate Function Calling***********************************************//
                                            getCalculatedAmount(monthTotalArrayAdded, id, function (response) {
                                                console.log('Calculated amount is : ' + response[0]);
                                                //var amount_array_data=0;
                                                amount_array.push(response[0]);
                                                cost= response[0];
                                                console.log('Calculation Breakup Array: ');
                                                var splitup = [];
                                                splitup = response[1];
                                                for (o in splitup) {
                                                    slabRateLitreFrom.push(splitup[o].litrefrom);
                                                    slabRateLitreTo.push(splitup[o].litreto);
                                                    slabRateCost.push(splitup[o].cost);
                                                    slabRateCPL.push(splitup[o].cpl);
                                                }
                                                console.log("Total Amount Payable");

                                                console.log(parseFloat(cost) + parseFloat(tot));


                                                for (p in slabRateLitreFrom) {
                                                    slabRateArrayBuilder.push({

                                                        fromLtr: slabRateLitreFrom[p],
                                                        toLtr: slabRateLitreTo[p],
                                                        ltrdiff: parseFloat(slabRateLitreTo[p])-parseFloat(slabRateLitreFrom[p]),
                                                        cost: slabRateCost[p],
                                                        cpl: slabRateCPL[p],
                                                    });
                                                }
                                            });
//***********************************************Function Calling End*************************************************//
                                            console.log("cumulative");
                                            console.log(cumulative_array);
                                            var cumulative_array_added = 0;
                                            for (v in cumulative_array) {
                                                cumulative_array_added = cumulative_array_added + cumulative_array[v];
                                            }

                                            console.log("Cumulative Added");
                                            cumulative_array_added = cumulative_array_added;
                                            console.log(cumulative_array_added);


                                            var dataBuilder = [];
                                            var charges_data = [];
                                            var Invoice_no_frst = moment().format('YYMMDD');
                                            console.log(Invoice_no_frst);
                                            setTimeout(function () {
                                                for (i in cust_nme_array) {
                                                    dataBuilder.push({
                                                        cust_name: cust_nme_array[i],
                                                        month_total: month_total_array[i],
                                                        cumulative : closingReading[i],
                                                        pre_month_cum : pre_cumulative_array[i]
                                                    });

                                                }

                                                console.log("Data Builder");
                                                console.log(dataBuilder);
                                                console.log("Slab Rate Array Full Details:");
                                                console.log(slabRateArrayBuilder);
                                                for (c in maintenance_charge_array) {
                                                    charges_data.push({
                                                        maintenance_charge: maintenance_charge_array[c],
                                                        service_charge: service_charge_array[c],
                                                        total_charges: total_charge_array,
                                                        amount_payable: parseFloat(cost) + parseFloat(tot)
                                                    });

                                                }
//***********************************************Entering Bill Amount to Database*************************************//
                                                setTimeout(function () {
                                                     sql = 'INSERT INTO `w2_bill_master`(`apart_id`,`dt`,`amount`) VALUES ("' + aprt_id + '","' + date_from_to.from_date_db + '","'+cost+'")';

                                                    connection.query(sql, function (err, result) {
                                                        if (err) {
                                                            res.send('ERORR8!!!!!!!!!!!!');
                                                        }

                                                        console.log("Amount Array");
                                                        console.log(cost);
                                                    });
                                                },1000)
//***********************************************Sending Data to JsReport Server**************************************//
                                                var data = {
                                                    template: {'shortid': 'rkJTnK2ce'},
                                                    data: {

                                                        "number": Invoice_no_frst + currentBillId,
                                                        "user": user,
                                                        tenant_detail_array,
                                                        aprt_name,
                                                        date_from_to,
                                                        cumulative_array_added, amount_array,
                                                        "charges": charges_data,
                                                        "pre_m_usage":pre_mon_ltr,
                                                        "pre_m_cost" :pre_mon_cost,
                                                        "slabRate": slabRateArrayBuilder,
                                                        "data": dataBuilder

                                                    },
                                                    options: {
                                                        headers: {
                                                            'Access-Control-Expose-Header': 'request'
                                                        },
                                                        "Content-Disposition": "attachment; filename=" + aprt_name.cust_name + blk_name.block_name + ".pdf",
                                                        preview: false
                                                    }
                                                }
                                                var options = {
                                                    uri: 'http://35.154.25.206:5488/api/report',
                                                    method: 'POST',
                                                    json: data
                                                }
                                                request(options).pipe(res);
                                            }, 2000);
                                        });
                                        } else {
                                            res.json({"result":"NDF01"});
                                        }
                                    });
                                });
                            });
                        });
                    });
                });
            });
            } else {
                res.json({"result":"NDF02"});
            }
        });
    });
});


app.listen(4000, function(){
    console.log('Port working on 4000!');
});

//***********************************************Slab Rate Function Begins Here***************************************//
function getCalculatedAmount(totallitres, siteID, callback) {

    var totallitres = totallitres;

    var litresdivide = [];
    var slabrate = [];

    var calculated = false;

    var costTotal = 0;

    // Fetch slabe rates from Mysql -> w2_slab_rates_dtl

    Promise.using(getSqlConnection(), function (connection) {
        return connection.query("SELECT * FROM `w2_slab_rates_dtl` WHERE site_id = " + siteID + " AND enabled = 1;").then(function (results) {


            if (results != '') {
                // getting slab rates into array
                for (s = 0; s < results.length; s++) {
                    slabrate.push({
                        id: results[s].id,
                        slabfrom: results[s].slabfrom,
                        slabto: results[s].slabto,
                        slabrate: results[s].slabrate
                    });
                }

                console.log('Liters Used in a month: ' + totallitres);

                // running through slabrates
                for (i = 0; i < slabrate.length; i++) {

                    if (!calculated) {
                        // 1000 - (2440 - 501)
                        var testdiff = slabrate[i].slabto - (totallitres);
                        //console.log(testdiff);
                        if (testdiff < 0) {
                            var slabratediff = (slabrate[i].slabto - slabrate[i].slabfrom) + 1;
                            var cost = parseFloat((slabratediff * slabrate[i].slabrate).toFixed(2));
                            litresdivide.push({
                                litrefrom: slabrate[i].slabfrom,
                                litreto: slabrate[i].slabto,
                                cost: cost,
                                cpl: slabrate[i].slabrate
                            });
                        } else {
                            var lastdiff = ((totallitres - slabrate[i].slabfrom));
                            var cost = parseFloat((lastdiff * slabrate[i].slabrate).toFixed(2));
                            litresdivide.push({
                                litrefrom: slabrate[i].slabfrom,
                                litreto: totallitres,
                                cost: cost,
                                cpl: slabrate[i].slabrate
                            });
                            calculated = true;
                            for (j = 0; j < litresdivide.length; j++) {
                                costTotal = costTotal + litresdivide[j].cost;
                            }
                        }
                    }
                }
                return callback([costTotal, litresdivide]);
            } else if (results == '') {
                console.log("no data");
                var nodata = "NDF"
            }
        }).catch(function (error) {
            console.log(error);
        });
    })
}
//***********************************************Slab Rate Function Ends Here*****************************************//
//***********************************************Invoice Generation Code Ends Here************************************//

////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
// 			                                    DAY WISE BLOCK USAGE REPORT                                           //
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
app.get('/day_wise', function (req,res){
    var s_id= req.query.s_id;
    var b_id= req.query.b_id;
    var from= req.query.from;
    var to  = req.query.to;
    var datetime =moment(new Date()).format('DD/MM/YYYY') ;
    console.log("date");
    console.log(datetime);
    console.log(from);
    console.log(to);
//******************************************************User Details**************************************************//
    var sql='SELECT w2_site_qa1.site_name,w2_site_qa1.site_address, w2_block.block_name FROM w2_site_qa1 INNER JOIN w2_block ON w2_site_qa1.site_id = w2_block.site_id where w2_block.site_id ="'+s_id+'" AND w2_block.id ="'+b_id+'"';
    connection.query(sql, function (err, result) {
        if (err)
        {
            res.send('ERORR!!!!!!!!!!!!')
        } else {
            var site_block=[];
            site_block= result;
        }
        site_block = site_block[0];

        var user_block_array=[];
        var user_site_array=[];
        var user_site_adrs_array=[];

        if(site_block.block_name) {

            user_block_array.push(site_block.block_name);
            user_site_array.push(site_block.site_name);
            user_site_adrs_array.push(site_block.site_address);

            var user_details = [];

            for (t in user_block_array) {
                user_details.push({
                    site_name: user_site_array[t],
                    block_name: user_block_array[t],
                    site_address: user_site_adrs_array[t],
                    from_date: from,
                    to_date: to,
                    generation_date: datetime
                });
            }

            console.log(user_details);

//********************************************************Block Name**************************************************//
             sql = 'SELECT block_name from w2_block where id="' + b_id + '"';
            connection.query(sql, function (err, result) {
                if (err) {
                    res.send('ERORR!!!!!!!!!!!!')
                } else {
                    var block = [];
                    block = result;
                }
                block = block[0];

                var block_Array = [];
                block_Array.push(block.block_name);

                var blk_details = [];

                for (t in block_Array) {
                    blk_details.push({blk_name: block_Array[t]});
                }

                 sql = 'CALL `sa_apart_list_daily` ("' + b_id + '","' + from + '","' + to + '")';
                connection.query(sql, function (err, result) {
                    if(result[0]!='') {
                        if (err) {
                            res.send('ERORR!!!!!!!!!!!!')
                        } else {
                            var apartmnt = [];
                            apartmnt = result[0];
                        }
                        console.log("Apartment");
                        console.log(apartmnt);
                        // var site_array=[];
                        var aprt_name_array = [];
                        var agg_total_array = [];
                        var date_array = []; // getting from db
                        var epoch_date = []; // Epoch converted date
                        var new_date = [];   // Date with GMT+5.30

                        //site_array.push(user.site_name);
                        for (a in apartmnt) {

                            aprt_name_array.push(apartmnt[a].cust_name);
                            agg_total_array.push(apartmnt[a].agg_total);
                            date_array.push(apartmnt[a].dt);
                        }
                        for (j in date_array) {
                            var myvar = date_array[j];
                            var x = Number(moment(date_array[j]).format('X'));
                            x = x * 1000;
                            epoch_date.push(x);
                            new_date.push(moment(epoch_date[j]).format('MM/DD/YYYY'));
                        }

                        var dataBuilder = [];

                        for (b in aprt_name_array) {
                            dataBuilder.push({
                                cust_name: aprt_name_array[b],
                                total: agg_total_array[b],
                                date: new_date[b]
                            });

                        }

                        console.log("Details For Invoice XLS ");
                        console.log(dataBuilder);

                        var data = {
                            template: {'shortid': 'r18kyD83ce'},
                            data: {

                                // "number":"001",
                                "user": user_details,
                                "data": dataBuilder,
                                "data1": blk_details


                            },

                            options: {
                                headers: {
                                    'Access-Control-Expose-Header': 'request'
                                },
                                "Content-Disposition": "attachment; filename='" + site_block.block_name + datetime + "'.xlsx",
                                preview: false
                            }

                        }
                        var options = {
                            uri: 'http://35.154.25.206:5488/api/report',
                            method: 'POST',
                            json: data
                        }

                        request(options).pipe(res);
                    } else{
                        res.json({"result":"NDF01"});
                    }
                });
            });
        } else {
            res.json({"result":"NDF03"});
        }
    });
});
//***********************************************Block Usage Report Code Ends Here************************************//

////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
// 			                                    DAY WISE APARTMENT USAGE REPORT			                              //
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
app.get('/day_wise_apart', function (req,res){
    var b_id= req.query.b_id;
    var aprt_id= req.query.aprt_id;
    var from= req.query.from;
    var to  = req.query.to;
    var datetime =moment(new Date()).format('DD/MM/YYYY') ;
    console.log("date");
    console.log(datetime);
    console.log(aprt_id);
    console.log(from);
    console.log(to);
//**************************************************Site and Block Details********************************************//
    var sql='SELECT w2_site_qa1.site_name,w2_site_qa1.site_address, w2_block.block_name FROM w2_site_qa1 INNER JOIN w2_block ON w2_site_qa1.site_id = w2_block.site_id where w2_block.id ="'+b_id+'"';
    connection.query(sql, function (err, result) {
        if (err)
        {
            res.send('ERORR!!!!!!!!!!!!')
        } else
        {
            var site_block=[];
            site_block= result;
        }
        site_block = site_block[0];
        if(site_block[0]!='') {
//****************************************************Apartment Details***********************************************//
             sql = 'SELECT  `cust_name`FROM `w2_apart_master` WHERE `id` ="' + aprt_id + '"';
            connection.query(sql, function (err, result) {
                if (err) {
                    res.send('ERORR!!!!!!!!!!!!')
                } else {
                    var user_aprt = [];
                    user_aprt = result;
                }
                user_aprt = user_aprt[0];
                var user_block_array = [];
                var user_site_array = [];
                var user_aprt_array = [];
                var user_site_adrs_array = [];

                user_block_array.push(site_block.block_name);
                user_site_array.push(site_block.site_name);
                user_aprt_array.push(user_aprt.cust_name);
                user_site_adrs_array.push(site_block.site_address);


                var user_details = [];

                for (t in user_block_array) {
                    user_details.push({
                        site_name: user_site_array[t],
                        block_name: user_block_array[t],
                        aprt_name: user_aprt_array[t],
                        site_address: user_site_adrs_array[t],
                        from_date: from,
                        to_date: to,
                        generation_date: datetime
                    });
                }

                console.log(user_details);

//*****************************************************Consumption Details**********************************************

                 sql = 'CALL `comp_sum_daywise_apart` ("' + aprt_id + '","' + from + '","' + to + '")';
                connection.query(sql, function (err, result) {
                    if(result[0]!='') {
                        if (err) {
                            res.send('ERORR!!!!!!!!!!!!')
                        } else {
                            var apartmnt = [];
                            apartmnt = result[0];
                        }
                        console.log("Apartment");
                        console.log(apartmnt);

                        var inlet_name_array = [];
                        var daily_usage_array = [];
                        var date_array = []; // getting from db
                        var epoch_date = []; // Epoch converted date
                        var new_date = [];   // Date with GMT+5.30


                        for (a in apartmnt) {
                            inlet_name_array.push(apartmnt[a].cust_name);
                            daily_usage_array.push(apartmnt[a].day_total);
                            date_array.push(apartmnt[a].dt);  //    console.log("EPOCH DATE");
                            //   console.log(epoch_date);

                            //console.log("NEW DATE");
                            // console.log(new_date);

                        }
                        for (j in date_array) {
                            var myvar = date_array[j];
                            var x = Number(moment(date_array[j]).format('X'));
                            x = x * 1000;
                            epoch_date.push(x);
                            new_date.push(moment(epoch_date[j]).format('MM/DD/YYYY'));

                        }
                        var dataBuilder = [];

                        for (b in inlet_name_array) {
                            dataBuilder.push({
                                inlet_name: inlet_name_array[b],
                                usage: daily_usage_array[b],
                                date: new_date[b]
                            });

                        }

                        console.log("Details For Invoice XLS ");
                        console.log(dataBuilder);

                        var data = {
                            template: {'shortid': 'S1nSgMN1G'},
                            data: {

                                // "number":"001",
                                "user": user_details,
                                "data": dataBuilder

                            },

                            options: {
                                headers: {
                                    'Access-Control-Expose-Header': 'request'
                                },
                                "Content-Disposition": "attachment; filename='" + site_block.block_name + user_aprt.cust_name + "'.xlsx",
                                preview: false
                            }

                        }
                        var options = {
                            uri: 'http://35.154.25.206:5488/api/report',
                            method: 'POST',
                            json: data
                        }

                        request(options).pipe(res);
                    } else {
                        res.json({"result":"NDF01"});
                    }
                });
            });
        } else {
            res.json({"result":"NDF02"});
        }
    });
});
//***********************************************Day Wise Apartment Report Code Ends Here*****************************//
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
// 			                                         SITE WATER TYPE USAGE REPORT			                          //
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
app.get('/site_water_det', function (req,res){
    var s_id= req.query.s_id;
    var from= req.query.from;
    var to  = req.query.to;
    var datetime =moment(new Date()).format('DD/MM/YYYY') ;
    console.log("date");
    console.log(datetime);
    console.log(from);
    console.log(to);

//***************************************************Site and Borewell************************************************//

    var sql='CALL `sa_site_water_type` ("'+s_id+'","'+from+'","'+to+'")';
    connection.query(sql, function (err, result) {
        if(result[0]!='') {
            if (err) {
                res.send('ERORR')
            } else {
                var water = [];
                water = result[0];
            }
            console.log("Water Details");
            console.log(water);

            var bwell_name_array = [];
            var bwell_daily_usage_array = [];
            var date_array = []; // getting from db
            var epoch_date = []; // Epoch converted date
            var new_date = [];   // Date with GMT+5.30

            for (m in water) {
                bwell_name_array.push(water[m].cust_name);
                bwell_daily_usage_array.push(water[m].agg_total);
                date_array.push(water[m].dt);  //    console.log("EPOCH DATE");

            }

            for (j in date_array) {
                var x = Number(moment(date_array[j]).format('X'));
                x = x * 1000;
                epoch_date.push(x);
                new_date.push(moment(epoch_date[j]).format('MM/DD/YYYY'));

            }
//************************************************************Municipal***********************************************//
             sql = "SELECT `water_type_id`  as municipal  ,`level`,`dt` FROM `w2_site_water_level` WHERE `site_id`='" + s_id + "' AND `water_type_id`='2' AND dt>='" + from + "' AND dt<='" + to + "'";
            connection.query(sql, function (err, result) {
                if (err) {
                    res.send('ERORR1')
                } else {
                    var municipal = [];
                    municipal = result;
                }
                console.log("Municipal Water Details");
                console.log(municipal);
//************************************************************Tanker**************************************************//
                 sql = "SELECT `water_type_id`  as tanker  ,`level`,`dt` FROM `w2_site_water_level` WHERE `site_id`='" + s_id + "' AND `water_type_id`='3' AND dt>='" + from + "' AND dt<='" + to + "'";
                connection.query(sql, function (err, result) {
                    if (err) {
                        res.send('ERORR2')
                    } else {
                        var tanker = [];
                        tanker = result;
                    }
                    console.log("Tanker Water Details");
                    console.log(tanker);
//********************************************************Rain water**************************************************//
                     sql = "SELECT `water_type_id`  as rain_water  ,`level`,`dt` FROM `w2_site_water_level` WHERE `site_id`='" + s_id + "' AND `water_type_id`='4' AND dt>='" + from + "' AND dt<='" + to + "'";
                    connection.query(sql, function (err, result) {
                        if (err) {
                            res.send('ERORR3')
                        } else {
                            var rain_water = [];
                            rain_water = result;
                        }
                        console.log("rain_water Water Details");
                        console.log(rain_water);
//********************************************************WTP*********************************************************//
                         sql = "SELECT `w2_wtplants`.site_id,`w2_wtplants`.id,`w2_wtplants_flow`.wtp_id,`w2_wtplants_flow`.inflow,`w2_wtplants_flow`.outflow,`w2_wtplants_flow`.dt FROM `w2_wtplants` INNER JOIN `w2_wtplants_flow` ON `w2_wtplants`.id=`w2_wtplants_flow`.wtp_id WHERE `w2_wtplants`.site_id='" + s_id + "'  AND dt>='" + from + "' AND dt<='" + to + "'";
                        connection.query(sql, function (err, result) {
                            if (err) {
                                res.send('ERORR4')
                            } else {
                                var wtp = [];
                                wtp = result;
                            }
                            console.log("WTP Details");
                            console.log(wtp);

                            var municipal_name_array = ['Municipal'];
                            var municipal_daily_usage_array = [];
                            var tanker_name_array = ['Tanker'];
                            var tanker_daily_usage_array = [];
                            var rain_water_name_array = ['Rain Water'];
                            var rain_water_daily_usage_array = [];
                            var wtp_name_array = ['WTP IN'];
                            var wtp_name_array_1 = ['WTP OUT'];
                            var wtp_inflow_usage_array = [];
                            var wtp_outflow_usage_array = [];
                            var municipal_date_array = [];
                            var tanker_date_array = [];
                            var rain_water_date_array = [];
                            var wtp_date_array = [];

                            for (n in municipal) {
                                municipal_daily_usage_array.push(municipal[n].level);
                                tanker_daily_usage_array.push(tanker[n].level);
                                rain_water_daily_usage_array.push(rain_water[n].level);
                                municipal_date_array.push(municipal[n].dt);
                                tanker_date_array.push(tanker[n].dt);
                                rain_water_date_array.push(rain_water[n].dt);
                            }
                            for (q in wtp) {
                                wtp_inflow_usage_array.push(wtp[q].inflow);
                                wtp_outflow_usage_array.push(wtp[q].outflow);
                                wtp_date_array.push(wtp[q].dt);
                            }
                            console.log("tytyy");
                            console.log(rain_water_daily_usage_array);
                            var dataBuilder = [];
                            var dataBuilder1 = [];
                            var dataBuilder2 = [];
                            var dataBuilder3 = [];
                            var dataBuilder4 = [];
                            var dataBuilder5 = [];

                            for (b in bwell_name_array) {
                                dataBuilder.push({
                                    bwell_name: bwell_name_array[b],
                                    usage: bwell_daily_usage_array[b],
                                    date: new_date[b],
                                    generation_date: datetime,
                                    site_name: water[0].site_name
                                });

                            }

                            for (c in municipal_daily_usage_array) {
                                dataBuilder1.push({
                                    municipal_name: municipal_name_array[0],
                                    municipal: municipal_daily_usage_array[c],
                                    date: moment(municipal_date_array[c]).format('DD/MM/YYYY')
                                })
                            }
                            for (d in tanker_daily_usage_array) {
                                dataBuilder2.push({
                                    tanker_name: tanker_name_array[0],
                                    tanker: tanker_daily_usage_array[d],
                                    date: moment(tanker_date_array[d]).format('DD/MM/YYYY')
                                })
                            }
                            for (e in rain_water_daily_usage_array) {
                                dataBuilder3.push({
                                    rain_water_name: rain_water_name_array[0],
                                    rain_water: rain_water_daily_usage_array[e],
                                    date: moment(rain_water_date_array[e]).format('DD/MM/YYYY')
                                })
                            }
                            for (f in wtp_inflow_usage_array) {
                                dataBuilder4.push({
                                    wtp_name: wtp_name_array[0],
                                    wtp_in: wtp_inflow_usage_array[f],
                                    date: moment(wtp_date_array[f]).format('DD/MM/YYYY')
                                })
                            }
                            for (g in wtp_outflow_usage_array) {
                                dataBuilder5.push({
                                    wtp_name: wtp_name_array_1[0],
                                    wtp_out: wtp_outflow_usage_array[g],
                                    date: moment(wtp_date_array[g]).format('DD/MM/YYYY')
                                })
                            }

                            //Pushing Zero s for empty array Start Here
                            if(dataBuilder1=='')
                            {
                                dataBuilder1.push({
                                    municipal_name: municipal_name_array[0],
                                    municipal: 0,
                                    date: new_date[0]
                                })
                            }
                            if(dataBuilder2=='')
                            {
                                dataBuilder2.push({
                                    tanker_name: tanker_name_array[0],
                                    tanker: 0,
                                    date: new_date[0]
                                })
                            }
                            if(dataBuilder3=='')
                            {
                                dataBuilder3.push({
                                    rain_water_name: rain_water_name_array[0],
                                    rain_water: 0,
                                    date: new_date[0]
                                })
                            }
                            //Zero Pushing ends here

                            console.log("Details For Invoice XLS ");
                            console.log(dataBuilder);
                            console.log(dataBuilder4);

                            var data = {
                                template: {'shortid': 'SJldeG4Jf'},
                                data: {

                                    // "number":"001",
                                    "data": dataBuilder,
                                    "data1": dataBuilder1,
                                    "data2": dataBuilder2,
                                    "data3": dataBuilder3,
                                    "data4": dataBuilder4,
                                    "data5": dataBuilder5


                                },

                                options: {
                                    headers: {
                                        'Access-Control-Expose-Header': 'request'
                                    },
                                    "Content-Disposition": "attachment; filename=WaterSourceReport-'" + datetime + "'.xlsx",
                                    preview: false
                                }

                            }
                            var options = {
                                uri: 'http://35.154.25.206:5488/api/report',
                                method: 'POST',
                                json: data
                            }

                            request(options).pipe(res);
                        });
                    });
                });
            });
        } else {
            res.json({"result":"NDF01"});
        }
    });
});
//***********************************************Day Wise Apartment Report Code Ends Here*****************************//
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
// 			                                    Overall Site Total Report                                  			  //
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
app.get('/site_wise_day', function (req,res){
    var s_id= req.query.s_id;
    var from= req.query.from;
    var to  = req.query.to;
    var datetime =moment(new Date()).format('DD/MM/YYYY') ;
    console.log("date");
    console.log(datetime);
    console.log(from);
    console.log(to);

    var sql='SELECT `dt`,`day_total` FROM `w2_site_totals` WHERE `site_id`="'+s_id+'" AND DATE(dt) >= "'+from+'" AND DATE(dt) <="'+to+'"';
    connection.query(sql, function (err, result) {
        if(result!='') {
            if (err) {
                res.send('ERORR1!!!!!!!!!!!!');
            } else {
                var siteWiseDayData = [];
                siteWiseDayData = result;
            }

            var date = [];
            var dayTotal = [];

            for (i in siteWiseDayData) {
                date.push(moment(siteWiseDayData[i].dt).format('DD/MM/YYYY'));

                dayTotal.push(siteWiseDayData[i].day_total)
            }
            console.log(date);
            console.log(dayTotal);

            var dataBuilder = [];

            for (j in date) {
                dataBuilder.push({
                    date: date[j],
                    dayTotal: dayTotal[j]
                })
            }
            console.log("Details for site day total ");
            console.log(dataBuilder);
            var data = {
                template: {'shortid': 'B1rNsc37M'},
                data: {

                    // "number":"001",
                    //"user": user_details,
                    "data": dataBuilder


                },

                options: {
                    headers: {
                        'Access-Control-Expose-Header': 'request'
                    },
                    "Content-Disposition": "attachment; filename=Overall Report " + from + " to " + to + ".xlsx",
                    preview: false
                }

            }
            var options = {
                uri: 'http://54.229.208.9:5488/api/report',
                method: 'POST',
                json: data
            }

            request(options).pipe(res);
        }else{
            res.json({"result":"NDF01"});
        }
    });
});
//***********************************************Overall Site Usage Report Code Ends Here*****************************//
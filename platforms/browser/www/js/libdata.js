/* Default data upon reset */
var data;
var dataCloud;
var dataInit = {
    "DataFormatVer": 2,
    "MyJsonID": "14gl63",
    "UserID": "test",
    "Timestamp": "01/01/2000",
    "CurrentID": "",
    "HabitList": [],
    "Custom": "",
    "DataList": {
    }
};

var selectedHabit = "";

/*  this function validates the data passed as pamaeter.
    very likely this is the local storage.
*/
function DataValidate(d)
{
    /* check for empty data */
    if (d === null || d === undefined)
        return false;

    ///* parse for further validations */
    d = JSON.parse(d);

    /* CurrentID should not be greater than current date */
    var dd = new Date();
    if (d.CurrentID.split("_")[0] > dd.getDate())
        return false;

    /* mandatory fields should not be blank */
    if (d.DataFormatVer == "" || d.DataFormatVer == null || d.DataFormatVer == undefined)
        return false;
    if (d.UserID == "" || d.UserID == null || d.UserID == undefined)
        return false;
    if (d.Timestamp == "" || d.Timestamp == null || d.Timestamp == undefined)
        return false;


    /* validation of the DataList */
    var prevEntry = 0;
    var keyCurrentID = false;
    for (var key in d.DataList)
    {
        /* There should be a key corresponding the current id */
        if (key == ("Date_" + d.CurrentID))
            keyCurrentID = true;

        /* Each item in DataList should have the same length as HabitList */
        if (d.DataList[key].length !== d.HabitList.length)
            return false;

        /* DataList entries should be contiguous */
        if ((prevEntry != 0) && parseInt(key.split("_")[1]) != (prevEntry + 1))
            return false;
        else
            prevEntry = parseInt(key.split("_")[1]);
    }
    if (keyCurrentID == false)
        return false;
    
    return true;
}

function DataCheckInternet()
{
    $.get("https://api.myjson.com/bins/" + TEST_JSON_ID, function (result, textStatus, xhdr)
    {
        if (result.DJApps == "TestData")
            DataRefresh(1);     /* connection successful. continue with sync */
        else
            return;             /* something went wrong. abort sync */
    });
}

function DataSaveCloud() {
    if (data.MyJsonID == "")    /* First time storing data to cloud */
    {
        $.get("https://api.myjson.com/bins/" + MASTER_JSON_ID, function (result, textStatus, xhdr) {
            DataSetMyJsonID(result[data.UserID]);
        });
    }
    else
    {
        $.ajax({
            url: "https://api.myjson.com/bins/" + data.MyJsonID,
            type: "PUT",
            data: JSON.stringify(data),
            contentType: "application/json; charset=utf-8",
            dataType: "json",
            success: function (result, status, xhdr) {
                DataRefresh(3);
            },
            error: function (xhdr, status, msg) {
                alert("There was an error saving data to cloud: " + msg);
            }
        }); 
    }
}

/* This function should only by called during cloud sync */
function DataLoadCloud() 
{
    /* It is assumed that RAM data is valid by now. */

    /*  First time accessing cloud data, get the id and then retrieve the data. */
    if (data.MyJsonID == "")
    {
        $.get("https://api.myjson.com/bins/" + MASTER_JSON_ID, function (result, textStatus, xhdr)
        {
            DataSetMyJsonID(result[data.UserID]);
            $.get("https://api.myjson.com/bins/" + data.MyJsonID, ReadCloudData);
        });
    }
    else /* Otherwise simply retrieve the data */
    {
        $.get("https://api.myjson.com/bins/" + data.MyJsonID, ReadCloudData);
    }

    function ReadCloudData(result, textStatus, xhdr)
    {
        if (result.DataFormatVer == undefined)
        {
            /* if cloud data is empty, put init values */
            dataCloud = dataInit; 

            /*  It is expected that the rest of the sync process will write the local data to cloud.
                So henceforth, cloud data will no longer be empty.
            */
        }
        else
        {
            /* put the actual cloud data for rest of the sync process */
            dataCloud = result;
        }
        
        DataRefresh(2);
    }
}

/*  This function will be called once at the begining of the app.
    In other words, every time index.html is loaded.
    An then it is perodically called.

    Description:
    - sync data with cloud.
        * The older data will be overwritten with the newer data.
        * Sync happens between RAM data and cloud data.
        * RAM data should always be written using the set APIs. In the set API its written back to localStorage.
    - refresh the local data, bring it up to current date
    - then update the table
*/
function DataRefresh(step)
{
    switch (step)
    {
        case 0:     /* check internet */
            DataCheckInternet();
            break;

        case 1:     /* sync start */
            DialogSimpleShow("Syncing data with cloud...");
            DataLoadCloud();
            break;

        case 2:     /* data received from cloud */
            var dateLocal = new Date(data.Timestamp);
            var dateCloud = new Date(dataCloud.Timestamp);

            if (dateLocal < dateCloud)
            {
                /* copy cloud data to local */
                data = dataCloud;
                DataSave(false);

                /* continue with next step directly */
            }
            else if (dateLocal >= dateCloud)
            {
                DataSaveCloud();
                break;
            }

        case 3:     /* local data synced with cloud */
            /* If there is update in the Data format version */
            DataFormatConversion();

            /* bring data up to date */
            var dateCur = new Date();
            var datePrev = new Date();
            datePrev.setDate(data.CurrentID.split("_")[0]);
            datePrev.setMonth(data.CurrentID.split("_")[1]);
            var date = new Date();
            for (date.setDate(datePrev.getDate() + 1); date.getDate() <= dateCur.getDate(); date.setDate(date.getDate() + 1)) {
                DataSetCurrentID(date);

                var arr = new Array();
                for (var i = 0; i < data.HabitList.length; i++)
                    arr.push(0);
                DataAdd(date, arr);
            }

            /* finish up */
            refreshTable();
            DialogSimpleHide();
            break;

        default:
            alert("invalid sync step");
    }
}

/*  this function will set the timestamp and copy RAM data to localStorage.
    Any data write operation should call this function.
    Otherwise, there will be inconsistent data.
    Timestamp should be updated only when there is change in actual data.
*/
function DataSave(flgUpdateTimestamp)
{
    if (flgUpdateTimestamp == true)
        data.Timestamp = new Date();

    localStorage.setItem("data", JSON.stringify(data));

    /* cant do cloud sync here because thats an async operation */

    /* other data which dont need cloud sync */
    localStorage.setItem("selectedHabit", selectedHabit);
}

/*  Data loaded from localStorage to RAM.
    This needs to be done whenever a new page is loaded, because RAM is local to the page.
    It is not necessary to repeatedly do this, because localStorage is always updated when RAM data is written throug the APIs.
*/
function DataLoad()
{
    /* Load the main data */
    var d = localStorage.getItem("data");
    if (DataValidate(d))
    {
        data = JSON.parse(d);
    }
    else
    {
        data = dataInit;
        DataSave(false);
    }

    /* other data which dont need cloud sync */
    d = localStorage.getItem("selectedHabit");
    if (d !== null && d !== undefined)
        selectedHabit = d;
    else
        selectedHabit = "";
}

/* before calling this function, make sure RAM data is valid */
function DataReset(ramData, localData, cloudData)
{
    if (ramData)
        data = {};

    if (localData)
        localStorage.clear();

    if (cloudData)
    {
        $.ajax({
            url: "https://api.myjson.com/bins/" + dataInit.MyJsonID,
            type: "PUT",
            data: JSON.stringify(data),
            contentType: "application/json; charset=utf-8",
            dataType: "json",
            success: function (result, status, xhdr)
            {
                alert("Cloud data is cleared");
            },
            error: function (xhdr, status, msg)
            {
                alert("Cloud data could not be cleared: " + msg);
            }
        });
    }
}

function DataShowAll(tag)
{
    if (typeof tag === undefined)
        tag = document.body;

    tag.innerHTML = "<b>All available data:</b><br />";

    for( var key in data )
    {
        if(key !== "DataList")
            tag.innerHTML += key;
            tag.innerHTML += "=";
            tag.innerHTML += data[key];
            tag.innerHTML += "<br />";
    }

    for( key in data.DataList )
    {
        tag.innerHTML += key;
        tag.innerHTML += "=";
        tag.innerHTML += data.DataList[key];
        tag.innerHTML += "<br />";
    }
}

function DataHabitAdd(habit)
{
    /* Update HabitList */
    data.HabitList.push(habit);

    /* Update DataList */
    if (data.CurrentID !== "") /* Check for first time usage */
    {
        for (var key in data.DataList)
            data.DataList[key].push(0);
    }
    else
    {
        /* First time */
        DataSetCurrentID(new Date());
        DataAdd(new Date(), [0]);
    }

    DataSave(true);
}

function DataHabitRemove(habit)
{
    /* Update HabitList */
    var id = -1;
    data.HabitList = data.HabitList.filter(
        function( element, index, array )
        {
            if (element === habit)
            {
                id = index;
                return false;
            }
            else
                return true;
        }
    );

    /* Update DataList */
    if (id !== -1)
    {
        for (var key in data.DataList)
        {
            data.DataList[key] = data.DataList[key].filter(
                function (element, index, array) {
                    return id !== index;
                }
            );
        }
    }

    DataSave(true);
}

function DataHabitUpdate(oldHabit, newHabit)
{
    /* validations */
    if (oldHabit == "" || newHabit == "")
        return;
    if (oldHabit == newHabit)
        return;

    var id = data.HabitList.indexOf(oldHabit);
    data.HabitList[id] = newHabit;

    DataSave(true);
}

function DataAdd(date,arr)
{
    flgError = false;

    if (arr.length !== data.HabitList.length)
        flgError = true;

    var d = "Date_" + date.getDate() + "_" + (date.getMonth()+1);
    data.DataList[d] = arr;

    if (flgError)
        alert("Error Adding data");
    else
        DataSave(true);
}

function DataSetCurrentID(date)
{
    data.CurrentID = date.getDate() + "_" + (date.getMonth() + 1);
    DataSave(true);
}

function DataSetMyJsonID(id) {
    data.MyJsonID = id;
    DataSave(false); /* todo if timestamp is set here, cloud data will not be loaded. on the other hand, JsonID will never be written to cloud/localStorage. */
}

function DataListSize()
{
    var size = 0;
    for (var key in data.DataList)
        size++;
    return size;
}

function DataGetByDate(date)
{
    var k = "Date_" + date.getDate() + "_" + (date.getMonth()+1);
    for (var key in data.DataList)
        if (k === key)
            return data.DataList[key];
}

function DataSetByDate(date, arr) {
    var k = "Date_" + date.getDate() + "_" + (date.getMonth() + 1);
    for (var key in data.DataList)
        if (k === key)
            data.DataList[key] = arr;
    DataSave(true);
}

function DataFormatConversion()
{
    /*  By now RAM data, local storage and cloud data are in sync and is valid.
        Assuming no other operation on the data is started yet.
    */
    if (dataInit.DataFormatVer > data.DataFormatVer)
    {
        alert("New version of data format available. Conversion is necessary.");
    }
}

function DataSelectedHabitReset()
{
    selectedHabit = "";
    DataSave(false);
}

function DataSelectedHabitUpdate(habitId)
{
    if (location.href.split("/").slice(-1) != "index.html")
    {
        alert("DataSelectedHabitUpdate() shall be called only from index.html");
        return null;
    }
    else
    {
        if (habitId == "")
            selectedHabit = "";
        else
            selectedHabit = document.getElementById(habitId).innerText;

        DataSave(false);
    }
}

function DataSelectedHabitGetId()
{
    if (location.href.split("/").slice(-1) != "index.html")
    {
        alert("DataSelectedHabitGetId() shall be called only from index.html");
        return null;
    }
    else
    {
        var arr = document.getElementsByClassName("habitColumn");

        for (var i = 0; i < arr.length; i++)
        {
            if (arr[i].innerText == selectedHabit)
                return arr[i].id;
        }

        return null;
    }
}

function DataSelectedHabitGetStr()
{
    return selectedHabit;
}
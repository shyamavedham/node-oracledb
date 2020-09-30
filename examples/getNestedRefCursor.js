'use strict'

const oracledb = require('oracledb');
const dbConfig = require('../config/dbConfig');
const numRows = 100;

oracledb.outFormat = oracledb.OUT_FORMAT_OBJECT;

module.exports.getNestedCursor = async function getNestedCursor(sqlStatement, bindVars, options, req, res, next) {

  async function traverseResultSet(resultSetObj, metaDataObj) {
    //console.log("inside traverse results");
    const fetchedRows = [];

    while (true) {
      const row = await resultSetObj.getRow();

      if (!row)
        break;
      //console.log(metaDataObj.length);
      for (var i = 0; i < metaDataObj.length; i++) {
        //console.log(metaDataObj[i].dbTypeName);
        if (metaDataObj[i].dbTypeName === "CURSOR") {
          row[metaDataObj[i].name] = await row[metaDataObj[i].name].getRows(100);
        }

      }

      fetchedRows.push(row);
    }
    return fetchedRows;
  }

  const connection = await oracledb.getConnection(dbConfig);

  try {
    const result = await connection.execute(sqlStatement, bindVars, options);

    const resultSet = result.outBinds.cursor;
    console.log("after proc call");
    //console.log(resultSet.metaData);
    const rows = await traverseResultSet(resultSet, resultSet.metaData);
    await resultSet.close();

    //console.log(rows);

    res.send(rows);
    //res.end;
  } catch (err) {
    console.error(err);
  } finally {
    if (connection) {
      try {
        await connection.close();
      } catch (err) {
        console.error(err);
      }
    }
  }
}



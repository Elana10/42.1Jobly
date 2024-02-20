const { BadRequestError } = require("../expressError");

/** Helper for making selective update queries. 
 * 
 * This function will generate the SQL query string used in SET
 * 1- With CONST KEYS it creates an array of all the keys that need to be updated. 
 * 2- IF() ensures that information is being updated or thros an error.
 * 3- With CONT COLS an array of strings is created by mapping over the array of keys from the dataToUpdate object and matching them to the jsToSQL syntax. 
 * 
 * dataToUpdate is an object filled with data_name : data_to_update.
 * jsToSql is an object with dat_name : SQL_column_name
 *  
**/

function sqlForPartialUpdate(dataToUpdate, jsToSql) {
  const keys = Object.keys(dataToUpdate);
  if (keys.length === 0) throw new BadRequestError("No data");

  // {firstName: 'Aliya', age: 32} => ['"first_name"=$1', '"age"=$2']
  const cols = keys.map((colName, idx) =>
      `"${jsToSql[colName] || colName}"=$${idx + 1}`,
  );
  
  return {
    setCols: cols.join(", "),
    values: Object.values(dataToUpdate),
  };
}

/**
 * Helper function for generating the SQL filter by command. 
 * 
 * Accepts a datatoFilterby object and jsToSql object
 * Returns a object with filterBy key and values key. 
 * 
**/

function sqlForFilterBy(dataToFilter, jsToSql) {
  const keys = Object.keys(dataToFilter);
  if (keys.length ===0) throw new BadRequestError("No filter data");

  const filters = keys.map(function(filterCol, idx) {
        if (filterCol === 'name'){        
          return `${jsToSql[filterCol] || filterCol} '%' || $${idx + 1} || '%' `
        } 
        if (filterCol === 'title'){        
          return `${jsToSql[filterCol] || filterCol} '%' || $${idx + 1} || '%' `
        } 
        if (filterCol === 'equity'){
          return `${jsToSql[filterCol] || filterCol} $${idx + 1} ` 
        } else {
          return `${jsToSql[filterCol] || filterCol} $${idx + 1} `          
        }
      })
      
      if(dataToFilter.hasEquity){
        dataToFilter.hasEquity = '0'
      }

  return {
    filterBy : filters.join("AND "),
    values : Object.values(dataToFilter)
  }
}


module.exports = { sqlForPartialUpdate, sqlForFilterBy };
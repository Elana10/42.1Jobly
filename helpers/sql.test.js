const { BadRequestError } = require('../expressError');
const {sqlForPartialUpdate} = require('./sql');

describe("sqlForPartialUpdate", function () {
    test("works: no new data to update, throw BadRequestError", function () {
        expect.assertions(1);
        expect(() => {
            sqlForPartialUpdate({}, {})
        }).toThrow(BadRequestError);
    })

    test("works: returns an object with sql code string and new values array", function () {
        expect.assertions(2);
        const results = sqlForPartialUpdate({firstName : 'Bob'}, {firstName : 'first_name'})
        expect(results.setCols).toEqual('"first_name"=$1');
        expect(results.values).toEqual(['Bob']);
    })

})
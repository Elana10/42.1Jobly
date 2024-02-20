"use strict";

const db = require("../db");
const { BadRequestError, NotFoundError } = require("../expressError");
const { sqlForPartialUpdate, sqlForFilterBy } = require("../helpers/sql");

/** Related functions for companies. */

class Job {
  /** Create a job (from data), update db, return new job data.
   *
   * data should be { title, salary, equity, company_handle }
   *
   * Returns { id, title, salary, equity, company_handle }
   *
   * Throws BadRequestError if company_handle not in database.
   * */

  static async create({ title, salary, equity, companyHandle }) {
    const companyCheck = await db.query(
          `SELECT handle
           FROM companies
           WHERE handle = $1`,
        [companyHandle]);

    if (!companyCheck.rows)
      throw new BadRequestError(`Company Not Found: ${companyHandle}`);

    const result = await db.query(
          `INSERT INTO jobs
           (title, salary, equity, company_handle)
           VALUES ($1, $2, $3, $4)
           RETURNING id, title, salary, equity, company_handle AS "companyHandle"`,
        [
          title,
          salary,
          equity,
          companyHandle
        ],
    );
    const job = result.rows[0];

    return job;
  }

  /** Find all jobs.
   *
   * Returns [{ id, title, salary, equity, company_handle }, ...]
   * */

  static async findAll({minSalary, hesEquity, title} ={}) {
    const jobRes = await db.query(
      `SELECT j.id,
        j.title,
        j.salary,
        j.equity,
        j.company_handle AS "companyHandle",
        c.name AS "companyName"
        FROM jobs AS j 
        LEFT JOIN companies AS c ON c.handle = j.company_handle`);
    return jobRes.rows;
  }

    /** Given a job id, return data about job.
   *
   * Returns { id, title, salary, equity, companyHandle, company }
   *   where company is { handle, name, description, numEmployees, logoUrl }
   *
   * Throws NotFoundError if not found.
   **/

    static async get(id) {
      const jobRes = await db.query(
            `SELECT id,
                    title,
                    salary,
                    equity,
                    company_handle AS "companyHandle"
             FROM jobs
             WHERE id = $1`, [id]);
  
      const job = jobRes.rows[0];
  
      if (!job) throw new NotFoundError(`No job: ${id}`);
  
      const companiesRes = await db.query(
            `SELECT handle,
                    name,
                    description,
                    num_employees AS "numEmployees",
                    logo_url AS "logoUrl"
             FROM companies
             WHERE handle = $1`, [job.companyHandle]);
  
      delete job.companyHandle;
      job.company = companiesRes.rows[0];
  
      return job;
    }

  /** Filter jobs by `data`.
   *
   * This is a selective filter --- it's fine if data doesn't contain
   * all the fields; this only filters by provided fields.
   *
   * Data can include:
   *   { title, minSalary, hasEquity}
   *
   * Returns {job1, job2, ...} 
   *
   * Throws NotFoundError if not found.
   *
   * Callers of this function must be certain they have validated inputs to this
   * or serious security risks are opened.
   */
  static async filterBy(data) {
    const { filterBy, values } = sqlForFilterBy(data,
      {
        title : "j.title LIKE ",
        minSalary : "j.salary > ",
        hasEquity : "j.equity > "
      });


    const querySql = `SELECT j.id,
                    j.title,
                    j.salary,
                    j.equity,
                    j.company_handle AS "companyHandle",
                    c.name AS "companyName"
                    FROM jobs j 
                    LEFT JOIN companies AS c ON c.handle = j.company_handle 
                    WHERE ${filterBy}`  
    
    const jobRes = await db.query(querySql, [...values]);
    return jobRes.rows;   



  }


  /** Update job data with `data`.
   *
   * This is a "partial update" --- it's fine if data doesn't contain all the
   * fields; this only changes provided ones.
   *
   * Data can include: {title, salary, equity}
   *
   * Returns { id, title, salary, equity, company_handle }
   *
   * Throws NotFoundError if not found.
   */

  static async update(id, data) {
    const { setCols, values } = sqlForPartialUpdate(
        data,
        {
          title : "title",
          salary : "salary",
          equity : "equity"
        });
    const idVarIdx = "$" + (values.length + 1);

    const querySql = `UPDATE jobs 
                      SET ${setCols} 
                      WHERE id = ${idVarIdx} 
                      RETURNING id, title, salary, equity, company_handle AS "companyHandle"`;
    const result = await db.query(querySql, [...values, id]);
    const job = result.rows[0];

    if (!job) throw new NotFoundError(`No job found: ${id}`);

    return job;
  }

  /** Delete given company from database; returns undefined.
   *
   * Throws NotFoundError if company not found.
   **/

  static async remove(id) {
    const result = await db.query(
          `DELETE
           FROM jobs
           WHERE id = $1
           RETURNING id`,
        [id]);
    const company = result.rows[0];

    if (!company) throw new NotFoundError(`No job found: ${id}`);
  }
}


module.exports = Job;

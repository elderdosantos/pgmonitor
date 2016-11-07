var PostgreSQL = require('pg');
var Client = PostgreSQL.Client;
var GUI = require('nw.gui');
var Window = GUI.Window.get();
Window.maximize();

var limit = "25";

var client = new Client("postgres://localhost/postgres");

function getTableSize(callback) {
  var sql = "SELECT relname, pg_relation_size(C.oid) AS size FROM pg_class C LEFT JOIN pg_namespace N ON (N.oid = C.relnamespace) WHERE nspname NOT IN ('pg_catalog', 'information_schema') ORDER BY pg_relation_size(C.oid) DESC LIMIT " + limit;
  client.query(sql, function (mError, mResponse) {
    if (mError) {
      callback(mError, null);
      return;
    }

    callback(null, mResponse.rows);
  });
}

function getSeqScan(callback) {
  var sql = "select schemaname, relname, seq_scan, idx_scan from pg_stat_user_tables order by seq_scan desc, idx_scan desc limit " + limit;

  client.query(sql, function (mError, mResponse) {
    if (mError) {
      callback(mError, null);
      return;
    }

    callback(null, mResponse.rows);
  });
}

function getListDatabase(callback) {
  var sql = "select * from pg_database where datname not like 'template%' order by datname";

  client.query(sql, function (mError, mResponse) {
    if (mError) {
      callback(mError, null);
      return;
    }

    callback(null, mResponse.rows);
  });
}

function fkWithoutIndex(callback) {
  var sql = "select * from (SELECT tc.constraint_name, tc.table_name, kcu.column_name, ccu.table_name AS foreign_table_name, ccu.column_name AS foreign_column_name, null condef FROM information_schema.table_constraints AS tc JOIN information_schema.key_column_usage AS kcu ON tc.constraint_name = kcu.constraint_name JOIN information_schema.constraint_column_usage AS ccu ON ccu.constraint_name = tc.constraint_name union all SELECT conname, null table_name, null column_name, null  foreign_table_name, null foreign_column_name, pg_catalog.pg_get_constraintdef(r.oid, true) as condef FROM pg_catalog.pg_constraint r) q where q.table_name || '.' || q.column_name not in (  select t.relname || '.' || a.attname from pg_class t, pg_class i, pg_index ix, pg_attribute a where t.oid = ix.indrelid and i.oid = ix.indexrelid and a.attrelid = t.oid and a.attnum = ANY(ix.indkey) and t.relkind = 'r' order by t.relname, i.relname) order by table_name, column_name";

  client.query(sql, function (mError, mResponse) {
    if (mError) {
      callback(mError, null);
      return;
    }

    callback(null, mResponse.rows);
  });
}

function explain(sql, callback)
{
  var explain_sql = "explain analyse " + sql;

  client.query(explain_sql, function (mError, mResponse) {
    if (mError) {
      callback(mError, null);
      return;
    }

    callback(null, mResponse.rows);
  });
}

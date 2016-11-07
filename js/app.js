var PGMonitor = {
  databases: null,
  current: null,
  url: null,

  init: function () {
    var currentDatabase = localStorage['database'];

    var currentUrl = localStorage['url'];

    if (_.isEmpty(currentUrl)) {
      swal(
        {
          title: "PGMonitor",
          text: "Enter the database url. Like 'user:pass@pgsql.google.com'",
          type: "input",
          showCancelButton: false,
          closeOnConfirm: false,
          animation: "slide-from-top",
          inputPlaceholder: "user:pass@pgsql.google.com"
        },
        function (inputValue) {
          if (inputValue === false) return false;
          
          if (inputValue === "") {
            swal.showInputError("Please enter url");
            return false
          }
          

          PGMonitor.url = "postgres://" + inputValue + "/postgres";
          localStorage['url'] = inputValue;

          swal("OK. I'm loading database now");

          client = new Client(PGMonitor.url);
          client.connect();
          
        }
      );
    }

    if (!_.isUndefined(currentDatabase)) {
      this.current = currentDatabase;

      PGMonitor.url = "postgres://" + localStorage['url'] + "/" + currentDatabase;
      client = new Client(PGMonitor.url);
      client.connect();
    }

    jQuery('#database_title').text(this.current);

    if (window.location.pathname == "/index.html") {
      PGMonitor.loadDatabases();
    }
    
  },

  changeServer: function () {
    swal(
      {
        title: "PGMonitor",
        text: "Enter the database url. Like 'user:pass@pgsql.google.com'",
        type: "input",
        showCancelButton: false,
        closeOnConfirm: false,
        animation: "slide-from-top",
        inputPlaceholder: "user:pass@pgsql.google.com"
      },
      function (inputValue) {
        if (inputValue === false) return false;
        
        if (inputValue === "") {
          swal.showInputError("Please enter url");
          return false
        }
        

        PGMonitor.url = "postgres://" + inputValue + "/postgres";
        localStorage['url'] = inputValue;

        swal("OK. I'm loading database now");

        client = new Client(PGMonitor.url);
        client.connect();
        PGMonitor.init();
      }
    );

    
  },

  loadDatabases: function () {
    getListDatabase(function (err, data) {
      jQuery('#database-container').html('');

      _.each(data, function (database, index) {
        jQuery('#database-container').append('<div class="col-md-3 col-sm-6 col-xs-12" onclick="PGMonitor.selectDatabase(\''+database.datname+'\');"><div class="info-box"><span class="info-box-icon bg-aqua"><i class="fa fa-database"></i></span><div class="info-box-content"><span class="info-box-text"><b>'+database.datname+'</b></span></div></div></div>');
      });
    });
  },

  selectDatabase: function (database) {
    localStorage['database'] = database;
    window.location = "database.html";

    document.title = "pgMonitor | Database View ["+database+"]";
  },

  tableSize: function () {
    getTableSize(function (err, tables) {
      var labels = [];
      var datas = [];
      _.each(tables, function (table, index) {
        labels.push(table.relname);
        datas.push((table.size / 1024) / 1024);
      });

      var data = {
        labels: labels,
        datasets: [
          {
            label: "in MB",
            backgroundColor: [
              'rgba(255, 99, 132, 0.2)',
              'rgba(54, 162, 235, 0.2)',
              'rgba(255, 206, 86, 0.2)',
              'rgba(75, 192, 192, 0.2)',
              'rgba(153, 102, 255, 0.2)',
              'rgba(255, 159, 64, 0.2)'
            ],
            borderColor: [
              'rgba(255,99,132,1)',
              'rgba(54, 162, 235, 1)',
              'rgba(255, 206, 86, 1)',
              'rgba(75, 192, 192, 1)',
              'rgba(153, 102, 255, 1)',
              'rgba(255, 159, 64, 1)'
            ],
            borderWidth: 0,
            data: datas,
          }
        ]
      };

      var chart = new Chart(
        jQuery('#tableSize').get(0).getContext("2d"),
        {
          type: 'horizontalBar',
          data: data,
          options: {}
        }
      );
    });
  },

  seqScan: function () {
    getSeqScan(function (err, seqs) {
      var labels = [];
      var datas = [];
      console.log(seqs);
      _.each(seqs, function (table, index) {
        labels.push(table.relname);
        datas.push(table.seq_scan);
      });

      var data = {
        labels: labels,
        datasets: [
          {
            label: "SEQSCAN's",
            backgroundColor: [
              'rgba(255, 99, 132, 0.2)',
              'rgba(54, 162, 235, 0.2)',
              'rgba(255, 206, 86, 0.2)',
              'rgba(75, 192, 192, 0.2)',
              'rgba(153, 102, 255, 0.2)',
              'rgba(255, 159, 64, 0.2)'
            ],
            borderColor: [
              'rgba(255,99,132,1)',
              'rgba(54, 162, 235, 1)',
              'rgba(255, 206, 86, 1)',
              'rgba(75, 192, 192, 1)',
              'rgba(153, 102, 255, 1)',
              'rgba(255, 159, 64, 1)'
            ],
            borderWidth: 0,
            data: datas,
          }
        ]
      };

      var chart = new Chart(
        jQuery('#seqScan').get(0).getContext("2d"),
        {
          type: 'horizontalBar',
          data: data,
          options: {}
        }
      );
    });
  },

  fkWithoutIndex: function () {
    fkWithoutIndex(function (err, data) {
      jQuery(jQuery('#fkWithoutIndex').find('tbody')).html();
      _.each(data, function (fk, index) {
        jQuery(jQuery('#fkWithoutIndex').find('tbody')).append('<tr><td>'+fk.constraint_name+'</td><td>'+fk.table_name+'</td><td>'+fk.column_name+'</td><td>'+fk.foreign_table_name+'</td><td>'+fk.foreign_column_name+'</td><td>'+fk.condef+'</td></tr>');
      });
    });
  }
};

jQuery('#form-explain').on('submit', function (event) {
  event.preventDefault();

  var sql = jQuery('textarea', '#form-explain').val();

  explain(sql, function (err, data) {
    jQuery('tbody', '#analyseResults').html('');
    _.each(data, function (explain, index) {
      jQuery('tbody', '#analyseResults').append('<tr><td>'+getPlan(explain['QUERY PLAN'])+'</td><td>'+getCost(explain['QUERY PLAN'])+'</td><td>'+getRows(explain['QUERY PLAN'])+'</td><td>'+getSeqScanDetail(explain['QUERY PLAN'])+'</td></tr>');
    });
  });
});

var spaces = 0;

function getPlan(str)
{
  if (str.indexOf("->") > -1) {
    if (spaces = 0) {
      spaces = 1;
    } else {
      spaces = 1 + spaces;
    }

    var newStr = "";

    for (var i = 0; i < spaces; i++) {
      newStr += "&nbsp;&nbsp;&nbsp;&nbsp;";
    }

    return newStr + str;
  }  else {
    spaces = 0;
  }
  return str;
}

function getCost(str)
{
  var position = str.indexOf('cost=');

  if (position < 0) {
    return "";
  }

  var startPosition = position + 5;

  var endPosition = str.substring(startPosition).indexOf(" ");



  return str.substr(startPosition, endPosition);
}

function getRows(str)
{
  var position = str.indexOf('rows=');

  if (position < 0) {
    return "";
  }

  var startPosition = position + 5;

  var endPosition = str.substring(startPosition).indexOf(" ");



  return str.substr(startPosition, endPosition);
}

function getSeqScanDetail(str)
{
  var position = str.indexOf("Seq Scan");

  if (position < 0) {
    return "";
  }

  return "SIM";
}

window.onerror = function (msg, url, lineNo, columnNo, error) {
    var string = msg.toLowerCase();
    var substring = "script error";
    if (string.indexOf(substring) > -1){
        swal('Script Error: See Browser Console for Detail');
    } else {
        swal(msg);
    }
  return false;
};

import { Component, Inject, NgZone, ViewChild } from '@angular/core';
import * as am4core from "@amcharts/amcharts4/core";
import * as am4charts from "@amcharts/amcharts4/charts";
import am4themes_animated from "@amcharts/amcharts4/themes/animated";
import am4themes_dark from "@amcharts/amcharts4/themes/dark";
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material';

import { Globals } from '../globals/Globals';
import { ApplicationService } from '../services/application.service';
import { ApiClient } from '../api/api-client';
import { MsfTableComponent } from '../msf-table/msf-table.component';
import { MsfDashboardPanelValues } from '../msf-dashboard-panel/msf-dashboard-panelvalues';
import { ChartFlags } from '../msf-dashboard-panel/msf-dashboard-chartflags';
import { CategoryArguments } from '../model/CategoryArguments';
import { Arguments } from '../model/Arguments';
import { Utils } from '../commons/utils';

am4core.useTheme(am4themes_animated);
am4core.useTheme(am4themes_dark);

// Grid, scrollbar and legend label colors
const white = am4core.color ("#ffffff");
const darkBlue = am4core.color ("#30303d");
const blueJeans = am4core.color ("#67b7dc");

@Component({
  selector: 'app-msf-dashboard-child-panel',
  templateUrl: './msf-dashboard-child-panel.component.html'
})
export class MsfDashboardChildPanelComponent {
  errorMessage: string;
  utils: Utils;

  values: MsfDashboardPanelValues;
  chart: any;

  chartTypes:any[] = [
    { name: 'Bars', flags: ChartFlags.XYCHART, createSeries: this.createVertColumnSeries },
    { name: 'Horizontal Bars', flags: ChartFlags.XYCHART | ChartFlags.ROTATED, createSeries: this.createHorizColumnSeries },
    { name: 'Simple Bars', flags: ChartFlags.NONE, createSeries: this.createSimpleVertColumnSeries },
    { name: 'Simple Horizontal Bars', flags: ChartFlags.ROTATED, createSeries: this.createSimpleHorizColumnSeries },
    { name: 'Stacked Bars', flags: ChartFlags.XYCHART | ChartFlags.STACKED, createSeries: this.createVertColumnSeries },
    { name: 'Horizontal Stacked Bars', flags: ChartFlags.XYCHART | ChartFlags.ROTATED | ChartFlags.STACKED, createSeries: this.createHorizColumnSeries },
    { name: 'Funnel', flags: ChartFlags.FUNNELCHART, createSeries: this.createFunnelSeries },
    { name: 'Lines', flags: ChartFlags.XYCHART | ChartFlags.LINECHART, createSeries: this.createLineSeries },                      
    { name: 'Area', flags: ChartFlags.XYCHART | ChartFlags.AREACHART, createSeries: this.createLineSeries },
    { name: 'Stacked Area', flags: ChartFlags.XYCHART | ChartFlags.STACKED | ChartFlags.AREACHART, createSeries: this.createLineSeries },
    { name: 'Pie', flags: ChartFlags.PIECHART, createSeries: this.createPieSeries },
    { name: 'Donut', flags: ChartFlags.DONUTCHART, createSeries: this.createPieSeries },
    { name: 'Table', flags: ChartFlags.TABLE }
  ];

  functions:any[] = [
    { id: 'avg' },
    { id: 'sum' },
    { id: 'max' },
    { id: 'min' },
    { id: 'count' }
  ];

  // table variables
  @ViewChild('msfTableRef')
  msfTableRef: MsfTableComponent;

  actualPageNumber: number;
  dataSource: boolean = false;
  template: boolean = false;
  moreResults: boolean = false;
  moreResultsBtn: boolean = false;
  displayedColumns;
  selectedIndex = 0;
  totalRecord = 0;
  metadata;

  constructor(
    public dialogRef: MatDialogRef<MsfDashboardChildPanelComponent>,
    private zone: NgZone,
    public globals: Globals,
    private http: ApiClient,
    private service: ApplicationService,
    @Inject(MAT_DIALOG_DATA) public data: any)
  {
    this.utils = new Utils ();

    this.destroyChart ();

    // generate drill down chart
    this.globals.popupLoading = true;
    this.service.getChildPanel (this, data.parentPanelId, this.data.drillDownId, this.configureChildPanel, this.handlerChildPanelError);
  }

  ngAfterViewInit(): void
  {
    if (this.isTablePanel ())
      this.msfTableRef.tableOptions = this;
  }

  ngOnDestroy()
  {
    this.destroyChart ();
  }

  onNoClick(): void
  {
    this.dialogRef.close ();
  }

  closeDialog(): void
  {
    this.dialogRef.close ();
  }

  // Function to create horizontal column chart series
  createHorizColumnSeries(values, stacked, chart, item, parseDate): void
  {
    // Set up series
    let series = chart.series.push (new am4charts.ColumnSeries ());
    series.name = item.valueAxis;
    series.dataFields.valueX = item.valueField;
    series.sequencedInterpolation = true;

    // Parse date if available
    if (parseDate)
    {
      series.dataFields.dateY = values.xaxis.columnName;
      series.dateFormatter.dateFormat = "MMM d, yyyy";
      series.columns.template.tooltipText = "{dateY}: {valueX}";
    }
    else
    {
      series.dataFields.categoryY = values.xaxis.columnName;
      series.columns.template.tooltipText = "{categoryY}: {valueX}";
    }

    // Configure columns
    series.stacked = stacked;
    series.columns.template.strokeWidth = 0;
    series.columns.template.width = am4core.percent (60);
  }

  // Function to create vertical column chart series
  createVertColumnSeries(values, stacked, chart, item, parseDate): void
  {
    let series = chart.series.push (new am4charts.ColumnSeries ());
    series.name = item.valueAxis;
    series.dataFields.valueY = item.valueField;
    series.sequencedInterpolation = true;

    if (parseDate)
    {
      series.dataFields.dateX = values.xaxis.columnName;
      series.dateFormatter.dateFormat = "MMM d, yyyy";
      series.columns.template.tooltipText = "{dateX}: {valueY}";
    }
    else
    {
      series.dataFields.categoryX = values.xaxis.columnName;
      series.columns.template.tooltipText = "{categoryX}: {valueY}";
    }

    series.stacked = stacked;
    series.columns.template.strokeWidth = 0;
    series.columns.template.width = am4core.percent (60);
  }

  // Function to create line chart series
  createLineSeries(values, stacked, chart, item, parseDate): void
  {
    // Set up series
    let series = chart.series.push (new am4charts.LineSeries ());
    series.name = item.valueAxis;
    series.dataFields.valueY = item.valueField;
    series.sequencedInterpolation = true;
    series.strokeWidth = 2;
    series.minBulletDistance = 10;
    series.tooltip.pointerOrientation = "horizontal";
    series.tooltip.background.cornerRadius = 20;
    series.tooltip.background.fillOpacity = 0.5;
    series.tooltip.label.padding (12, 12, 12, 12);
    series.tensionX = 0.8;

    if (parseDate)
    {
      series.dataFields.dateX = values.xaxis.columnName;
      series.dateFormatter.dateFormat = "MMM d, yyyy";
      series.tooltipText = "{dateX}: {valueY}";
    }
    else
    {
      series.dataFields.categoryX = values.xaxis.columnName;
      series.tooltipText = "{categoryX}: {valueY}";
    }

    // Fill area below line for area chart types
    if (values.currentChartType.flags & ChartFlags.AREAFILL)
      series.fillOpacity = 0.3;

    series.stacked = stacked;
  }

  // Function to create simple vertical column chart series
  createSimpleVertColumnSeries(values, stacked, chart, item, parseDate): void
  {
    let series = chart.series.push (new am4charts.ColumnSeries());
    series.dataFields.valueY = item.valueField;
    series.dataFields.categoryX = item.titleField;
    series.name = item.valueField;
    series.columns.template.tooltipText = "{categoryX}: {valueY}";
    series.columns.template.strokeWidth = 0;

    series.stacked = stacked;

    // Set colors
    series.columns.template.adapter.add ("fill", (fill, target) => {
      return am4core.color (values.paletteColors[0]);
    });
  }

  // Function to create simple horizontal column chart series
  createSimpleHorizColumnSeries(values, stacked, chart, item, parseDate): void
  {
    let series = chart.series.push (new am4charts.ColumnSeries());
    series.dataFields.valueX = item.valueField;
    series.dataFields.categoryY = item.titleField;
    series.name = item.valueField;
    series.columns.template.tooltipText = "{categoryY}: {valueX}";
    series.columns.template.strokeWidth = 0;

    series.stacked = stacked;

    series.columns.template.adapter.add ("fill", (fill, target) => {
      return am4core.color (values.paletteColors[0]);
    });
  }

  // Function to create pie chart series
  createPieSeries(values, stacked, chart, item, parseDate): void
  {
    let series, colorSet;

    // Set inner radius for donut chart
    if (values.currentChartType.flags & ChartFlags.PIEHOLE)
      chart.innerRadius = am4core.percent (60);

    // Configure Pie Chart
    series = chart.series.push (new am4charts.PieSeries ());
    series.dataFields.value = item.valueField;
    series.dataFields.category = item.titleField;

    // This creates initial animation
    series.hiddenState.properties.opacity = 1;
    series.hiddenState.properties.endAngle = -90;
    series.hiddenState.properties.startAngle = -90;

    // Set ticks color
    series.ticks.template.strokeOpacity = 1;
    series.ticks.template.stroke = darkBlue;
    series.ticks.template.strokeWidth = 1;

    // Set the color for the chart to display
    colorSet = new am4core.ColorSet ();
    colorSet.list = values.paletteColors.map (function(color) {
      return am4core.color (color);
    });
    series.colors = colorSet;
  }

  // Function to create funnel chart series
  createFunnelSeries(values, stacked, chart, item, parseDate): void
  {
    let series, colorSet;

    series = chart.series.push (new am4charts.FunnelSeries ());
    series.dataFields.value = item.valueField;
    series.dataFields.category = item.titleField;

    // Set chart apparence
    series.sliceLinks.template.fillOpacity = 0;
    series.ticks.template.strokeOpacity = 1;
    series.ticks.template.stroke = darkBlue;
    series.ticks.template.strokeWidth = 1;
    series.alignLabels = true;

    // Set the color for the chart to display
    colorSet = new am4core.ColorSet ();
    colorSet.list = values.paletteColors.map (function(color) {
      return am4core.color (color);
    });
    series.colors = colorSet;
  }

  makeChart(chartInfo): void
  {
    this.zone.runOutsideAngular (() => {
      let chart;

      // Check chart type before generating it
      if (this.values.currentChartType.flags & ChartFlags.FUNNELCHART
        || this.values.currentChartType.flags & ChartFlags.PIECHART)
      {
        if (this.values.currentChartType.flags & ChartFlags.FUNNELCHART)
          chart = am4core.create ("msf-dashboard-child-panel-chart-display", am4charts.SlicedChart);
        else
          chart = am4core.create ("msf-dashboard-child-panel-chart-display", am4charts.PieChart);

        chart.data = chartInfo.dataProvider;
        chart.numberFormatter.numberFormat = "#,###.#";

        // Set label font size
        chart.fontSize = 10;

        // Create the series
        this.values.currentChartType.createSeries (this.values, false, chart, chartInfo, null);

        if (this.values.currentChartType.flags & ChartFlags.FUNNELCHART)
        {
          // Sort values from greatest to least on funnel chart types
          chart.events.on ("beforedatavalidated", function(event) {
            chart.data.sort (function(e1, e2) {
              return e2[chartInfo.valueField] - e1[chartInfo.valueField];
            });
          });
        }
      }
      else
      {
        let categoryAxis, valueAxis, parseDate, stacked;

        chart = am4core.create ("msf-dashboard-child-panel-chart-display", am4charts.XYChart);
        chart.numberFormatter.numberFormat = "#,###.#";

        // Don't parse dates if the chart is a simple version
        if (this.values.currentChartType.flags & ChartFlags.XYCHART)
        {
          chart.data = chartInfo.data;
          parseDate = this.values.xaxis.columnName.includes ('date');
        }
        else
        {
          chart.data = chartInfo.dataProvider;
          parseDate = false;
        }

        // Set chart axes depeding on the rotation
        if (this.values.currentChartType.flags & ChartFlags.ROTATED)
        {
          if (parseDate)
          {
            categoryAxis = chart.yAxes.push (new am4charts.DateAxis ());
            categoryAxis.dateFormats.setKey ("day", "MMM d");
            categoryAxis.periodChangeDateFormats.setKey ("day", "yyyy");
          }
          else
          {
            categoryAxis = chart.yAxes.push (new am4charts.CategoryAxis ());
            categoryAxis.renderer.minGridDistance = 15;
            categoryAxis.renderer.labels.template.maxWidth = 240;
          }

          valueAxis = chart.xAxes.push (new am4charts.ValueAxis ());

          // Add scrollbar into the chart for zooming if there are multiple series
          if (chart.data.length > 1)
          {
            chart.scrollbarY = new am4core.Scrollbar ();
            chart.scrollbarY.background.fill = blueJeans;
          }
        }
        else
        {
          if (parseDate)
          {
            categoryAxis = chart.xAxes.push (new am4charts.DateAxis ());
            categoryAxis.dateFormats.setKey ("day", "MMM d");
            categoryAxis.periodChangeDateFormats.setKey ("day", "yyyy");
          }
          else
          {
            categoryAxis = chart.xAxes.push (new am4charts.CategoryAxis ());
            categoryAxis.renderer.minGridDistance = 30;

            // Rotate labels if the chart is displayed vertically
            categoryAxis.renderer.labels.template.rotation = 330;
            categoryAxis.renderer.labels.template.maxWidth = 240;
          }

          valueAxis = chart.yAxes.push (new am4charts.ValueAxis ());

          if (chart.data.length > 1)
          {
            chart.scrollbarX = new am4core.Scrollbar ();
            chart.scrollbarX.background.fill = blueJeans;
          }
        }

        // Set category axis properties
        categoryAxis.renderer.labels.template.fontSize = 10;
        categoryAxis.renderer.labels.template.wrap = true;
        categoryAxis.renderer.labels.template.horizontalCenter  = "right";
        categoryAxis.renderer.labels.template.textAlign  = "end";
        categoryAxis.renderer.grid.template.location = 0;
        categoryAxis.renderer.grid.template.strokeOpacity = 1;
        categoryAxis.renderer.line.strokeOpacity = 1;
        categoryAxis.renderer.grid.template.stroke = darkBlue;
        categoryAxis.renderer.line.stroke = darkBlue;
        categoryAxis.renderer.grid.template.strokeWidth = 1;
        categoryAxis.renderer.line.strokeWidth = 1;

        // Set value axis properties
        valueAxis.renderer.labels.template.fontSize = 10;
        valueAxis.renderer.grid.template.strokeOpacity = 1;
        valueAxis.renderer.grid.template.stroke = darkBlue;
        valueAxis.renderer.grid.template.strokeWidth = 1;

        if (this.values.currentChartType.flags & ChartFlags.XYCHART)
        {
          // The category will be the x axis if the chart type has it
          categoryAxis.dataFields.category = this.values.xaxis.columnName;

          stacked = (this.values.currentChartType.flags & ChartFlags.STACKED) ? true : false;
          if (this.values.currentChartType.flags & ChartFlags.LINECHART && stacked)
          {
            // Avoid negative values on the stacked area chart
            for (let object of chartInfo.filter)
            {
              for (let data of chartInfo.data)
              {
                if (data[object.valueField] == null)
                  continue;

                if (data[object.valueField] < 0)
                  data[object.valueField] = 0;
              }
            }
          }

          // Sort chart series from least to greatest by calculating the
          // average (normal) or total (stacked) value of each key item to
          // compensate for the lack of proper sorting by values
          if (stacked && !(this.values.currentChartType.flags & ChartFlags.LINECHART))
          {
            for (let item of chart.data)
            {
              let total = 0;

              for (let object of chartInfo.filter)
              {
                let value = item[object.valueField];

                if (value != null)
                  total += value;
              }

              item["sum"] = total;
            }

            chart.events.on ("beforedatavalidated", function(event) {
              chart.data.sort (function(e1, e2) {
                return e1.sum - e2.sum;
              });
            });
          }
          else
          {
            for (let object of chartInfo.filter)
            {
              let average = 0;

              for (let data of chartInfo.data)
              {
                let value = data[object.valueField];

                if (value != null)
                  average += value;
              }

              object["avg"] = average / chartInfo.data.length;
            }

            // Also sort the data by date the to get the correct order on the line chart
            // if the category axis is a date type
            if (parseDate && this.values.currentChartType.flags & ChartFlags.LINECHART)
            {
              let axisField = this.values.xaxis.columnName;
  
              chart.events.on ("beforedatavalidated", function(event) {
                chart.data.sort (function(e1, e2) {
                  return +(new Date(e1[axisField])) - +(new Date(e2[axisField]));
                });
              });
            }

            chartInfo.filter.sort (function(e1, e2) {
              return e1.avg - e2.avg;
            });
          }

          // Create the series and set colors
          chart.colors.list = [];

          for (let color of this.values.paletteColors)
            chart.colors.list.push (am4core.color (color));

          for (let object of chartInfo.filter)
            this.values.currentChartType.createSeries (this.values, stacked, chart, object, parseDate);

          // Add cursor if the chart type is line, area or stacked area
          if (this.values.currentChartType.flags & ChartFlags.LINECHART)
          {
            chart.cursor = new am4charts.XYCursor ();
            chart.cursor.xAxis = valueAxis;
            chart.cursor.snapToSeries = chart.series;
          }
        }
        else
        {
          // The category will the values if the chart type lacks an x axis
          categoryAxis.dataFields.category = chartInfo.titleField;

          // Sort values from least to greatest
          chart.events.on ("beforedatavalidated", function(event) {
            chart.data.sort (function(e1, e2) {
              return e1[chartInfo.valueField] - e2[chartInfo.valueField];
            });
          });

          // Create the series
          this.values.currentChartType.createSeries (this.values, false, chart, chartInfo, parseDate);
        }
      }

      if (this.values.currentChartType.flags & ChartFlags.XYCHART)
      {
        // Display Legend
        chart.legend = new am4charts.Legend ();
        chart.legend.markers.template.width = 15;
        chart.legend.markers.template.height = 15;
        chart.legend.labels.template.fontSize = 10;
      }

      // Add export button
      chart.exporting.menu = new am4core.ExportMenu ();
      chart.exporting.menu.verticalAlign = "top";
      chart.exporting.menu.align = "left";

      this.chart = chart;
    });
  }

  destroyChart(): void
  {
    if (this.chart)
    {
      this.zone.runOutsideAngular (() => {
        if (this.chart)
          this.chart.dispose ();
      });
    }
  }

  checkGroupingValue(categoryColumnName, values): boolean
  {
    if (values == null)
      return false;

    for (let value of values)
    {
      if (value.columnName === categoryColumnName)
        return true;          // already in the grouping list
    }

    return false;
  }

  checkGroupingCategory(argument): boolean
  {
    if (argument.name1 != null && argument.name1.toLowerCase ().includes ("grouping"))
    {
      if (this.values.currentChartType.flags & ChartFlags.TABLE)
        return true; // tables must not check this!
      else if (!(this.values.currentChartType.flags & ChartFlags.INFO))
      {
        if (this.values.variable.grouping && !this.checkGroupingValue (this.values.variable.columnName, argument.value1))
          return false;

        if (this.values.currentChartType.flags & ChartFlags.XYCHART)
        {
          if (this.values.xaxis.grouping && !this.checkGroupingValue (this.values.xaxis.columnName, argument.value1))
            return false;
        }

        if (this.values.valueColumn.grouping && !this.checkGroupingValue (this.values.valueColumn.columnName, argument.value1))
          return false;
      }
    }

    return true;
  }

  checkPanelVariables(): boolean
  {
    let currentOptionCategories = this.values.currentOptionCategories;

    if (currentOptionCategories)
    {
      for (let i = 0; i < currentOptionCategories.length; i++)
      {
        let category: CategoryArguments = currentOptionCategories[i];

        if (category && category.arguments)
        {
          for (let j = 0; j < category.arguments.length; j++)
          {
            let argument: Arguments = category.arguments[j];

            if (!this.checkGroupingCategory (argument))
              return false;
          }
        }
      }
    }

    return true;
  }

  getParameters()
  {
    let currentOptionCategories = this.values.currentOptionCategories;
    let parentArgument = this.data.parentCategory.item.argumentsId;
    let parentCategoryId = this.data.parentCategory.id.toLowerCase ();
    let filterValue = this.data.categoryFilter;
    let secondaryParentCategoryId = null;
    let secondaryParentArgument = null;
    let secondaryFilterValue = this.data.secondaryCategoryFilter;
    let params;

    if (this.data.secondaryParentCategory != null)
    {
      secondaryParentCategoryId = this.data.secondaryParentCategory.id.toLowerCase ();
      secondaryParentArgument = this.data.secondaryParentCategory.item.argumentsId;
    }

    if (currentOptionCategories)
    {
      for (let i = 0; i < currentOptionCategories.length; i++)
      {
        let category: CategoryArguments = currentOptionCategories[i];
        
        if (category && category.arguments)
        {
          for (let j = 0; j < category.arguments.length; j++)
          {
            let argument: Arguments = category.arguments[j];

            if (parentArgument != null && argument.id == parentArgument.argumentId.id)
            {
              if (params)
                params += "&" + this.utils.getArguments2 (argument, parentCategoryId, filterValue);
              else
                params = this.utils.getArguments2 (argument, parentCategoryId, filterValue);
            }
            else if (secondaryParentArgument != null && argument.id == secondaryParentArgument.argumentId.id)
            {
              if (params)
                params += "&" + this.utils.getArguments2 (argument, secondaryParentCategoryId, secondaryFilterValue);
              else
                params = this.utils.getArguments2 (argument, secondaryParentCategoryId, secondaryFilterValue);
            }
            else
            {
              if (params)
              {
                if (argument.type != "singleCheckbox" && argument.type != "serviceClasses" && argument.type != "fareLower" && argument.type != "airportsRoutes" && argument.name1 != "intermediateCitiesList")
                  params += "&" + this.utils.getArguments (argument);
                else if (argument.value1 != false && argument.value1 != "" && argument.value1 != undefined && argument.value1 != null)
                  params += "&" + this.utils.getArguments (argument);
              }
              else
                params = this.utils.getArguments (argument);
            }
          }
        }        
      }
    }
  
    return params;
  }

  getOption(dashboardPanelOption)
  {
    if (dashboardPanelOption != null)
    {
      for (let option of this.data.options)
      {
        if (option.id == dashboardPanelOption.id)
          return option;
      }
    }

    return null;
  }

  configureChildPanel(_this, data)
  {
    let i, notConfigured;

    notConfigured = false;

    if (data == null)
    {
      _this.noPanelFound (_this);
      return;
    }

    _this.values = new MsfDashboardPanelValues (_this.data.options, data.title,
      data.id, null, null, _this.getOption (data.option), data.analysis, data.xaxis,
      data.values, data.function, data.chartType, JSON.stringify (_this.data.currentOptionCategories),
      data.lastestResponse, data.paletteColors);

    _this.values.tableVariables = [];

    for (let columnConfig of _this.values.currentOption.columnOptions)
      _this.values.tableVariables.push ( { id: columnConfig.columnName, name: columnConfig.columnLabel, itemId: columnConfig.id, grouping: columnConfig.grouping, checked: true } );

    // init child panel settings
    if (_this.values.currentChartType != null && _this.values.currentChartType != -1)
    {
      for (i = 0; i < _this.chartTypes.length; i++)
      {
        if (i == _this.values.currentChartType)
        {
          _this.values.currentChartType = _this.chartTypes[i];
          break;
        }
      }
    }
    else
      i = _this.chartTypes.length;

    if (i == _this.chartTypes.length)
      notConfigured = true;

    if (_this.values.currentChartType.flags & ChartFlags.XYCHART)
    {
      if (_this.values.xaxis != null && _this.values.xaxis != -1)
      {
        for (i = 0; i < _this.values.currentOption.columnOptions.length; i++)
        {
          if (i == _this.values.xaxis)
          {
            _this.values.xaxis = _this.values.currentOption.columnOptions[i];
            break;
          }
        }
      }
      else
        i = _this.values.currentOption.columnOptions.length;

      if (i == _this.values.currentOption.columnOptions.length)
        notConfigured = true;
    }

    if (_this.values.currentChartType.flags & ChartFlags.TABLE)
    {
      for (i = 0; i < _this.values.lastestResponse.length; i++)
      {
        let tableColumn = _this.values.lastestResponse[i];

        if (tableColumn.id == null)
          continue;
  
        for (let j = 0; j < _this.values.tableVariables.length; j++)
        {
          let curVariable = _this.values.tableVariables[j];
  
          if (curVariable.itemId == tableColumn.id)
          {
            curVariable.checked = tableColumn.checked;
            break;
          }
        }
      }
    }
    else
    {
      if (_this.values.variable != null && _this.values.variable != -1)
      {
        for (i = 0; i < _this.values.currentOption.columnOptions.length; i++)
        {
          if (i == _this.values.variable)
          {
            _this.values.variable = _this.values.currentOption.columnOptions[i];
            break;
          }
        }
      }
      else
        i = _this.values.currentOption.columnOptions.length;
  
      if (i == _this.values.currentOption.columnOptions.length)
        notConfigured = true;

      if (_this.values.valueColumn != null && _this.values.valueColumn != -1)
      {
        for (i = 0; i < _this.values.currentOption.columnOptions.length; i++)
        {
          if (i == _this.values.valueColumn)
          {
            _this.values.valueColumn = _this.values.currentOption.columnOptions[i];
            break;
          }
        }
      }
      else
        i = _this.values.currentOption.columnOptions.length;

      if (i == _this.values.currentOption.columnOptions.length)
        notConfigured = true;

      if (_this.values.function != null && _this.values.function != -1)
      {
        for (i = 0; i < _this.functions.length; i++)
        {
          if (i == _this.values.function)
          {
            _this.values.function = _this.functions[i];
            break;
          }
        }
      }
      else
        i = _this.functions.length;

      if (i == _this.functions.length)
        notConfigured = true;
    }

    if (notConfigured)
    {
      _this.panelNotConfigured ();
      return;
    }

    _this.service.loadOptionCategoryArguments (_this, _this.values.currentOption, _this.setCategories, _this.handlerCategoryError);
  }

  setCategories(_this, data)
  {
    // check if any variable that requires grouping are in configure properly
    if (!_this.checkPanelVariables ())
    {
      _this.globals.popupLoading = false;
      _this.errorMessage = "Some variables used to get the results must be added in the grouping inside the parent control variables";
      return;
    }

    // add category arguments not available on the parent to the child panel, so the service will work properly
    for (let optionCategory of data)
    {
      for (let category of optionCategory.categoryArgumentsId)
      {
        let avail = false;
        for (let curCategory of _this.values.currentOptionCategories)
        {
          if (curCategory.id == category.id)
          {
            avail = true;

            // use child panel argument name
            for (let i = 0; i < curCategory.arguments.length; i++)
            {
              if (curCategory.arguments[i].name1 != null)
                curCategory.arguments[i].name1 = category.arguments[i].name1;

              if (curCategory.arguments[i].name2 != null)
                curCategory.arguments[i].name2 = category.arguments[i].name2;

              if (curCategory.arguments[i].name3 != null)
                curCategory.arguments[i].name3 = category.arguments[i].name3;
            }

            break;
          }
        }
  
        if (!avail)
          _this.values.currentOptionCategories.push (category);
      }
    }

    if (_this.values.currentChartType.flags & ChartFlags.TABLE)
      _this.loadDataTable (false, _this.msfTableRef.handlerSuccess, _this.msfTableRef.handlerError);
    else
      _this.loadChartData (_this.handlerChartSuccess, _this.handlerDataError);
  }

  noPanelFound(_this)
  {
    _this.globals.popupLoading = false;
    _this.errorMessage = "This drill down option has not been configured for this panel";
  }

  panelNotConfigured()
  {
    this.globals.popupLoading = false;
    this.errorMessage = "This drill down option is not configured properly";
  }

  handlerChildPanelError(_this)
  {
    _this.globals.popupLoading = false;
    _this.errorMessage = "Unable to get child panel";
  }

  handlerCategoryError(_this)
  {
    _this.globals.popupLoading = false;
    _this.errorMessage = "Failed to generate chart";
  }

  noDataFound(): void
  {
    this.globals.popupLoading = false;
    this.errorMessage = "No data available for chart generation";
  }

  loadDataTable(moreResults, handlerSuccess, handlerError): void
  {
    let url, urlBase, urlArg;

    this.msfTableRef.displayedColumns = [];
  
    if (moreResults)
    {
      this.actualPageNumber++;
      this.moreResults = true;
    }
    else
      this.actualPageNumber = 0;

    if (!this.actualPageNumber)
      this.msfTableRef.dataSource = null;

    urlBase = this.values.currentOption.baseUrl + "?" + this.getParameters ();
    urlBase += "&MIN_VALUE=0&MAX_VALUE=999&minuteunit=m&&pageSize=100&page_number=" + this.actualPageNumber;
    console.log(urlBase);
    urlArg = encodeURIComponent(urlBase);
    url = this.service.host + "/consumeWebServices?url=" + urlArg + "&optionId=" + this.values.currentOption.id;

    for (let tableVariable of this.values.tableVariables)
    {
      if (tableVariable.checked)
        url += "&metaDataIds=" + tableVariable.itemId;
    }

    this.http.get (this.msfTableRef, url, handlerSuccess, handlerError, null);
  }

  loadChartData(handlerSuccess, handlerError): void
  {
    let url, urlBase, urlArg;

    urlBase = this.values.currentOption.baseUrl + "?" + this.getParameters ();
    urlBase += "&MIN_VALUE=0&MAX_VALUE=999&minuteunit=m&pageSize=999999&page_number=0";
    console.log (urlBase);
    urlArg = encodeURIComponent (urlBase);
    url = this.service.host + "/getChartData?url=" + urlArg + "&variable=" + this.values.variable.columnName +
      "&valueColumn=" + this.values.valueColumn.columnName + "&function=" + this.values.function.id;

    // don't use the xaxis parameter if the chart type is pie, donut or radar
    if (!(this.values.currentChartType.flags & ChartFlags.XYCHART))
      url += "&chartType=pie";
    else
      url += "&xaxis=" + this.values.xaxis.columnName;

    this.http.post (this, url, null, handlerSuccess, handlerError);
  }

  handlerChartSuccess(_this, data): void
  {
    if (_this.values.currentChartType.flags & ChartFlags.XYCHART && _this.utils.isJSONEmpty (data.data))
    {
      _this.noDataFound ();
      return;
    }

    if ((!(_this.values.currentChartType.flags & ChartFlags.XYCHART) && data.dataProvider == null) ||
      (_this.values.currentChartType.flags & ChartFlags.XYCHART && !data.filter))
    {
      _this.noDataFound ();
      return;
    }

    _this.makeChart (data);
    _this.globals.popupLoading = false;
  }

  handlerDataError(_this, result): void
  {
    console.log (result);
    _this.globals.popupLoading = false;
    _this.errorMessage = "Failed to generate child panel information";
  }

  isTablePanel(): boolean
  {
    return (this.values != null && this.values.currentChartType.flags & ChartFlags.TABLE) ? true : false;
  }

  finishLoadingTable(error)
  {
    this.globals.popupLoading = false;
  }

  moreTableResults()
  {
    if (this.moreResultsBtn)
    {
      this.moreResults = false;

      this.globals.popupLoading = true;

      setTimeout (() => {
        this.loadDataTable (true, this.msfTableRef.handlerSuccess, this.msfTableRef.handlerError);
      }, 3000);
    }
  }
}
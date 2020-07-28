'use strict';

/* globals d3 */

let average = (array) => array.reduce((a, b) => a + b) / array.length;


var calendarHeatmap = {

    settings: {
        gutter: 5,
        item_gutter: 1,
        width: 1000,
        height: 300,
        item_size: 10,
        label_padding: 40,
        max_block_height: 20,
        transition_duration: 500,
        tooltip_width: 250,
        tooltip_padding: 15,
    },

    stats:{
        weekly_avg_minutes: 0,
    },

    /**
     * Initialize
     */
    init: function (data) {

        // Set calendar data
        calendarHeatmap.data = data;

        // Set calendar color
        calendarHeatmap.color = '#ff4500';
        calendarHeatmap.colorScale = d3.scaleSequential()
            .interpolator(d3.interpolatePuBu)
            .domain([-300, 720]);

        // Initialize current overview type and history
        calendarHeatmap.view_type = 'week';
        calendarHeatmap.selected = {};

        // Set handler function
        calendarHeatmap.handler = function (val) {
            console.log(val);
        };

        // No transition to start with
        calendarHeatmap.in_transition = false;

        // Parse data for summary details
        calendarHeatmap.getDataStats();

        // Create html elements for the calendar
        calendarHeatmap.createElements();



    },


    /**
     * Create html elements for the calendar
     */
    createElements: function () {
        // Create main html container for the calendar
        var container = document.createElement('div');
        container.className = 'calendar-heatmap';
        document.body.appendChild(container);
        calendarHeatmap.yearContainer = d3.select(container).append('div')
            .attr('id', 'heatmap-year-container');
        // Create svg element
        calendarHeatmap.svg = d3.select(container).append('svg').attr('id', 'root')
        // .attr('viewBox', '0 0 600 2000');
        // Create other svg elements
        calendarHeatmap.items = calendarHeatmap.svg.append('g');
        calendarHeatmap.labels = calendarHeatmap.svg.append('g');


        // Add tooltip to the same element as main svg
        calendarHeatmap.tooltip = d3.select(container).append('div')
            .attr('class', 'heatmap-tooltip')
            .style('opacity', 0);

        // Add description section
        calendarHeatmap.descriptions = d3.select(container).append('div')
            .attr('class', 'heatmap-description')

        calendarHeatmap.scrollhint = d3.select(container).append('div')
            .attr('class', 'header-down-arrow')
        // Calculate dimensions based on available width
        var calcDimensions = function () {

            var dayIndex = Math.round((moment() - moment().subtract(1, 'year').startOf('week')) / 86400000);
            var colIndex = Math.trunc(dayIndex / 7);
            var numWeeks = colIndex + 1;

            // console.log(container.offsetWidth);
            calendarHeatmap.settings.width = container.offsetWidth < 1000 ? 1000 : container.offsetWidth;
            calendarHeatmap.settings.item_size = ((calendarHeatmap.settings.width - calendarHeatmap.settings.label_padding) / numWeeks - calendarHeatmap.settings.gutter);
            calendarHeatmap.settings.height = calendarHeatmap.settings.label_padding + 7 * (calendarHeatmap.settings.item_size + calendarHeatmap.settings.gutter) + 50;
            console.log(calendarHeatmap.settings);
            if (calendarHeatmap.view_type == 'week'){
                calendarHeatmap.svg.attr('width', calendarHeatmap.settings.width).attr('height', calendarHeatmap.settings.height)
            }
            else{
                calendarHeatmap.svg.attr('width', 0).attr('height', 0)
            }

            if ( calendarHeatmap.data ) {
                calendarHeatmap.drawChart();
            }

        };
        calcDimensions();

        window.onresize = function (event) {
            calcDimensions();
        };
    },


    /**
     * Parse data for summary in case it was not provided
     */
    getDataStats: function () {
        console.log("get data stats....");
        if (!calendarHeatmap.data) {
            return;
        }
        let by_week = d3.nest()
            .key(d => [d.date.getUTCFullYear(), moment(d.date).week()])
            .entries(data)
            .reverse();
        let weekly_minutes_avg = by_week.map(x => x.values);
        for (var i=0; i < weekly_minutes_avg.length; i++){
            weekly_minutes_avg[i].total_minutes = 0
            for (var j=0; j < weekly_minutes_avg[i].length; j++){
                weekly_minutes_avg[i].total_minutes += weekly_minutes_avg[i][j].minutes;
            }
        }
        calendarHeatmap.stats.weekly_avg_minutes = average(weekly_minutes_avg.map(x => x.total_minutes));
        console.log("weekly average minutes: ", calendarHeatmap.stats.weekly_avg_minutes);
        // Get daily summary if that was not provided
    },


    /**
     * Draw the chart based on the current overview type
     */
    drawChart: function () {
        if (calendarHeatmap.view_type === 'year') {
            calendarHeatmap.removeWeekOverview();
            calendarHeatmap.drawYearOverview();
        } else if (calendarHeatmap.view_type === 'week') {
            calendarHeatmap.removeYearOverview();
            calendarHeatmap.drawWeekOverview();
        }
    },


    /**
     * Draw year overview
     */
    drawYearOverview: function () {

        // Add current overview to the history
        let weeksInMonth = function (month) {
            let m = d3.timeMonth.floor(month)
            return d3.timeWeeks(d3.timeWeek.floor(m), d3.timeMonth.offset(m, 1)).length;
        }

        let minDate = d3.min(calendarHeatmap.data, function (d) {
            return new Date(d.date)
        })
        let maxDate = d3.max(calendarHeatmap.data, function (d) {
            return new Date(d.date)
        })
        let cellMargin = calendarHeatmap.settings.item_size/10,
            cellSize = calendarHeatmap.settings.item_size;

        let day = d3.timeFormat("%w"),
            week = d3.timeFormat("%U"),
            format = d3.timeFormat("%Y-%m-%d"),
            monthName = d3.timeFormat("%B"),
            months = d3.timeMonth.range(d3.timeMonth.floor(minDate), maxDate);

        calendarHeatmap.yearContainer.selectAll("svg").remove()
        let month_svg = calendarHeatmap.yearContainer.selectAll("svg")
            .data(months)
            .enter().append("svg")
            .attr("class", "month")
            .attr("height", ((cellSize * 7) + (cellMargin * 8) + 20) ) // the 20 is for the month labels
            .attr("width", function(d) {
                var columns = weeksInMonth(d);
                return ((cellSize * columns) + (cellMargin * (columns + 1)));
            })
            .append("g")

        month_svg.append("text")
            .attr("class", "month-name")
            .attr("y", (cellSize * 7) + (cellMargin * 8) + 15)
            .attr("x", function (d) {
                var columns = weeksInMonth(d);
                return (((cellSize * columns) + (cellMargin * (columns + 1))) / 2);
            })
            .attr("text-anchor", "middle")
            .text(function (d) {
                return monthName(d);
            })

        let lookupminutes = d3.nest()
            .key(function(d) { return format(d.date); })
            .rollup(function(leaves) {
                return d3.sum(leaves, function(d){ return parseInt(d.minutes); });
            })
            .object(calendarHeatmap.data);

        // TODO
        let lookuptooltips = d3.nest()
            .key(function(d) { return format(d.date); })
            .rollup(function(leaves) {
                return d3.sum(leaves, function(d){ return parseInt(d.minutes); });
            })
            .object(calendarHeatmap.data);

        let rect = month_svg.selectAll("rect.day")
            .data(function (d, i) {
                return d3.timeDays(d, new Date(d.getFullYear(), d.getMonth() + 1, 1));
            })
            .enter().append("rect")
            .attr("class", "day")
            .attr("width", cellSize)
            .attr("height", cellSize)
            .attr("rx", 3).attr("ry", 3) // rounded corners
            .attr("y", function (d) {
                return (day(d) * cellSize) + (day(d) * cellMargin) + cellMargin;
            })
            .attr("x", function (d) {
                return ((week(d) - week(new Date(d.getFullYear(), d.getMonth(), 1))) * cellSize) + ((week(d) - week(new Date(d.getFullYear(), d.getMonth(), 1))) * cellMargin) + cellMargin;
            })
            .attr("fill", '#eaeaea') // default light grey fill
            .attr("fill", d => calendarHeatmap.colorScale(lookupminutes[format(d)]))
            .on("mouseover", function (d) {
                d3.select(this).classed('hover', true);
            })
            .on("mouseout", function (d) {
                d3.select(this).classed('hover', false);
            })
            .datum(format);


        rect.filter(function(d) { return d in lookupminutes; })
            .style("fill", function(d) { return calendarHeatmap.colorScale(lookupminutes[format(d)]); });

        calendarHeatmap.drawDescription();
    },


    /**
     * Draw week overview
     */
    drawWeekOverview: function () {
        // Define beginning and end of the week
        let start_of_week = moment(calendarHeatmap.selected.date).startOf('week');
        let end_of_week = moment(calendarHeatmap.selected.date).endOf('week');

        // Filter data down to the selected week
        let week_data = calendarHeatmap.data.filter(function (d) {
            return start_of_week <= moment(d.date) && moment(d.date) < end_of_week;
        });
        week_data['total_minutes'] = week_data.map(x=>x.minutes)
            .reduce(function (a, b) { return a + b;})
        week_data["weekly_salary"] = week_data.total_minutes/60 * 50;
        console.log("week data: ", week_data);

        // Define week labels and axis
        let week_labels = [start_of_week];
        let weekScale = d3.scaleBand()
            .rangeRound([calendarHeatmap.settings.label_padding, calendarHeatmap.settings.width], 0.01)
            .domain(week_labels.map(function (weekday) {
                return weekday.week();
            }));
        // Add week labels
        calendarHeatmap.labels.selectAll('.label-week').remove();
        calendarHeatmap.labels.selectAll('.label-week')
            .data(week_labels)
            .enter()
            .append('text')
            .attr('class', 'label label-week')
            .attr('font-weight', 'bold')
            .attr('font-size', function () {
                return Math.floor(calendarHeatmap.settings.label_padding / 2.5) + 'px';
            })
            .text(function (d) {
                return 'Week ' + d.week() + ' (' + start_of_week.format('M/D/YYYY') + ' - ' + end_of_week.format('M/D/YYYY') + ')';
            })
            .attr('x', function (d) {
                return weekScale(d.week());
            })
            .attr('y', calendarHeatmap.settings.label_padding / 3)



        // Add time labels
        let timeLabels = d3.timeHours(moment().startOf('day'), moment().endOf('day'));
        let timeScale = d3.scaleTime()
            .rangeRound([calendarHeatmap.settings.label_padding * 2, calendarHeatmap.settings.width])
            .domain([0, 24*60*60]);
        let getDailyPassedSeconds = function(d){
            return d.getHours()*60*60 + d.getMinutes()*60 + d.getSeconds()
        }
        calendarHeatmap.labels.selectAll('.label-time').remove();
        calendarHeatmap.labels.selectAll('.label-time')
            .data(timeLabels)
            .enter()
            .append('text')
            .attr('class', 'label label-time')
            .attr('font-size', function () {
                return Math.floor(calendarHeatmap.settings.label_padding / 3) + 'px';
            })
            .text(function (d) {
                return moment(d).format('H:mm');
            })
            .attr('x', function (d, i) {
                return timeScale(i*60*60);
            })
            .attr('y', calendarHeatmap.settings.label_padding)
            .on('mouseenter', function (d) {
                if ( calendarHeatmap.in_transition ) { return; }

                let selected = timeScale(d.getHours()*60*60 + d.getMinutes()*60 + d.getSeconds());
                calendarHeatmap.items.selectAll('.item-block')
                    .transition()
                    .duration(calendarHeatmap.settings.transition_duration)
                    .ease(d3.easeLinear)
                    .style('opacity', function (d) {
                        let start = timeScale(getDailyPassedSeconds(d.start_time));
                        let end = timeScale(getDailyPassedSeconds(d.end_time));
                        return ( selected >= start && selected <= end ) ? 1 : 0.1;
                    });
            })
            .on('mouseout', function () {
                if ( calendarHeatmap.in_transition ) { return; }

                calendarHeatmap.items.selectAll('.item-block')
                    .transition()
                    .duration(calendarHeatmap.settings.transition_duration)
                    .ease(d3.easeLinear)
                    .style('opacity', 0.5);
            });


        let day_labels = d3.timeDays(moment().startOf('week'), moment().endOf('week'));
        let dayScale = d3.scaleBand()
            .rangeRound([calendarHeatmap.settings.label_padding, calendarHeatmap.settings.height -50])
            .domain(day_labels.map(function (d) {
                return moment(d).format('dddd');
            }));

        calendarHeatmap.labels.selectAll('.label-day').remove();
        calendarHeatmap.labels.selectAll('.label-day')
            .data(day_labels)
            .enter()
            .append('text')
            .attr('class', 'label label-day')
            .attr('x', calendarHeatmap.settings.label_padding / 3)
            .attr('y', function (d, i) {
                return dayScale(moment(d).format('dddd')) + dayScale.bandwidth();
            })
            .style('text-anchor', 'left')
            .attr('font-size', function () {
                return Math.floor(calendarHeatmap.settings.label_padding / 3) + 'px';
            })
            .text(function (d, i) {
                return moment(d).format('ddd');
            })
            .on('mouseenter', function (d) {
                if (calendarHeatmap.in_transition) {
                    return;
                }

                let selected_day = moment(d);
                console.log(selected_day);
                console.log(d);
                calendarHeatmap.items.selectAll('.item-block')
                    .transition()
                    .duration(calendarHeatmap.settings.transition_duration)
                    .ease(d3.easeLinear)
                    .style('opacity', function (d) {
                        return (moment(d.date).day() === selected_day.day()) ? 1 : 0.1;
                    });


            })
            .on('mouseout', function () {
                if (calendarHeatmap.in_transition) {
                    return;
                }

                calendarHeatmap.items.selectAll('.item-block')
                    .transition()
                    .duration(calendarHeatmap.settings.transition_duration)
                    .ease(d3.easeLinear)
                    .style('opacity', 1);
            });

        //add time line
        calendarHeatmap.items.selectAll('.item-block').remove();
        calendarHeatmap.items.selectAll('.item-block')
            .data(week_data)
            .enter()
            .append('rect')
            .attr('class', 'item item-block')
            .attr('x', function (d) {
                return timeScale(d.start_time.getHours()*60*60 + d.start_time.getMinutes()*60 + d.start_time.getSeconds())
            })
            .attr('y', function (d) {
                return dayScale(moment(d.date).format('dddd')) + dayScale.bandwidth();
            })
            .attr('width', function (d) {
                let start = timeScale(getDailyPassedSeconds(d.start_time));
                let end = timeScale(getDailyPassedSeconds(d.end_time));
                return Math.max((end - start), 1);
            })
            .attr('height', function () {
                return Math.min(dayScale.bandwidth(), calendarHeatmap.settings.max_block_height);
            })
            .attr('fill', function (d) {
                return calendarHeatmap.colorScale(d.minutes);
            })
            .style('opacity', 0)
            .on('mouseover', function(d) {
                if ( calendarHeatmap.in_transition ) { return; }

                // Construct tooltip
                let tooltip_html = '';
                tooltip_html += '<div class="header"><strong>' + (d.minutes ? calendarHeatmap.formatTime(d.minutes*60) : 'No time') + ' tracked</strong></div>';
                tooltip_html += '<div>on ' + moment(d.date).format('dddd, MMM Do YYYY HH:mm') + '</div>';
                tooltip_html += '<br><div class="header"><strong>Details</strong><div>';
                for (let i=0; i < d.work_have_done.length; i++){
                    tooltip_html += '<p>' + (i+1) + '. ' + d.work_have_done[i] + '</p>';
                }
                tooltip_html += '<br><div class="header"><strong>Tags</strong><div>';
                for (let i=0; i < d.tags_have_done.length; i++){
                    tooltip_html += '<span><i>' + d.tags_have_done[i] + '</i></span>';
                }


                // Calculate tooltip position
                let x =  timeScale(getDailyPassedSeconds(d.start_time) + 0.5*60*60);
                while ( calendarHeatmap.settings.width - x < (calendarHeatmap.settings.tooltip_width + calendarHeatmap.settings.tooltip_padding * 3) ) {
                    x -= 10;
                }
                let y = dayScale(moment(d.start_time).format('dddd')) + dayScale.bandwidth() / 2 + calendarHeatmap.settings.tooltip_padding;
                // console.log(x, y);
                // Show tooltip
                calendarHeatmap.tooltip.html(tooltip_html)
                    .style('left', x + 'px')
                    .style('top', y + 'px')
                    .transition()
                    .duration(calendarHeatmap.settings.transition_duration / 2)
                    .ease(d3.easeLinear)
                    .style('opacity', 1);
            })
            .on('mouseout', function () {
                if ( calendarHeatmap.in_transition ) { return; }
                calendarHeatmap.hideTooltip();
            })
            .on('click', function (d) {
                if ( !!calendarHeatmap.handler && typeof calendarHeatmap.handler == 'function' ) {
                    calendarHeatmap.handler(d);
                }
            })
            .transition()
            .delay(1.5*calendarHeatmap.settings.transition_duration)
            .duration(calendarHeatmap.settings.transition_duration)
            .ease(d3.easeLinear)
            .style('opacity', 0.5)
            .end()
            .then(() => calendarHeatmap.drawDescription(week_data));

    },


    drawDescription:  function (data) {

        calendarHeatmap.descriptions.selectAll('h2').remove();
        if (calendarHeatmap.view_type === 'week') {
            let this_hour = data.total_minutes / 60;
            let hist_hour = calendarHeatmap.stats.weekly_avg_minutes / 60;
            let inspiration_text = this_hour > hist_hour ? "Sometimes it's good to take a rest!" : "Hope you are having fun!"
            calendarHeatmap.texts = [
                "In this week you have done <span class='emphasize'>" + (this_hour).toFixed(2) + "</span> hours of work ... Good Job!<br>",
                "You have made <span class='emphasize'>$" + data.weekly_salary.toFixed(2) + "</span> !<br>",
                "The average weekly working hour in the past years were <span class='emphasize'>" + (hist_hour).toFixed(2) + "</span> hours...<br>",
                inspiration_text
            ]

            calendarHeatmap.descriptions.selectAll('.heatmap-description')
                .data(calendarHeatmap.texts)
                .enter()
                .append('h2')
                .attr('class', function (d, i) {
                    return i % 2 == 0 ? 'heatmap-description-odd' : 'heatmap-description-even';
                })
                .style('opacity', 0)
                .html(x => x)
                .transition()
                .duration(1500)
                .delay(function (d, i) {
                    return i * 1300
                })
                .ease(d3.easeLinear)
                .style('opacity', 1)
                .end()
                .then(() => calendarHeatmap.drawScrollHint());

            // "In this week you "
            // drawWeeklySummary(data);
        }
        else{
            calendarHeatmap.texts = [
                "Pick a date to dig into weekly details...."
            ]
            calendarHeatmap.descriptions.selectAll('.heatmap-description')
                .data(calendarHeatmap.texts)
                .enter()
                .append('h2')
                .attr('class', function (d, i) {
                    return i % 2 == 0 ? 'heatmap-description-odd' : 'heatmap-description-even';
                })
                .style('opacity', 0)
                .html(x => x)
                .transition()
                .duration(1500)
                .delay(function (d, i) {
                    return i * 1300
                })
                .ease(d3.easeLinear)
                .style('opacity', 1)
        }

    },

    /**
     * Draw the button for navigation purposes
     */
    drawScrollHint: function () {
        console.log(calendarHeatmap.texts)
        calendarHeatmap.scrollhint.selectAll('img').remove();
        let pic_src = 'https://cssanimation.rocks/levelup/public/images/'
        pic_src += (calendarHeatmap.view_type == 'week') ? 'downarrow.png' : 'uparrow.png'
        let scroll_bar = calendarHeatmap.scrollhint
            .append('img')
            .attr('src', 'https://cssanimation.rocks/levelup/public/images/downarrow.png')
            .attr('width', '50')
            .on('click', function (d) {
                (calendarHeatmap.view_type == 'week') ? calendarHeatmap.view_type = 'year' : calendarHeatmap.view_type = 'week';
                calendarHeatmap.drawChart();
            })

    },

    /**
     * Transition and remove items and labels related to year overview
     */
    removeYearOverview: function () {
        calendarHeatmap.yearContainer.selectAll("svg")
            .transition()
            .duration(calendarHeatmap.settings.transition_duration)
            .ease(d3.easeLinear)
            .style('opacity', 0)
            .remove();
    },


    /**
     * Transition and remove items and labels related to week overview
     */
    removeWeekOverview: function () {
        calendarHeatmap.items.selectAll('.item-block')
            .transition()
            .duration(calendarHeatmap.settings.transition_duration)
            .ease(d3.easeLinear)
            .style('opacity', 0)
            .attr('x', function (d, i) {
                return (i % 2 === 0) ? -calendarHeatmap.settings.width / 3 : calendarHeatmap.settings.width / 3;
            })
            .remove();
        calendarHeatmap.labels.selectAll('.label-day').remove();
        calendarHeatmap.labels.selectAll('.label-time').remove();
        calendarHeatmap.svg.attr('width', 0).attr('height', 0);
        calendarHeatmap.hideScrollHint();
    },

    /**
     * Helper function to hide the tooltip
     */
    hideTooltip: function () {
        calendarHeatmap.tooltip.transition()
            .duration(calendarHeatmap.settings.transition_duration / 2)
            .ease(d3.easeLinear)
            .style('opacity', 0);
    },


    /**
     * Helper function to hide the back button
     */
    hideScrollHint: function () {
        calendarHeatmap.scrollhint.selectAll('img')
            .transition()
            .duration(calendarHeatmap.settings.transition_duration)
            .ease(d3.easeLinear)
            .style('opacity', 0)
            .remove();
    },


    /**
     * Helper function to convert seconds to a human readable format
     * @param seconds Integer
     */
    formatTime: function (seconds) {
        let sec_num = parseInt(seconds, 10);
        let hours = Math.floor(sec_num / 3600);
        let minutes = Math.floor((sec_num - (hours * 3600)) / 60);
        let time = '';
        if (hours > 0) {
            time += hours === 1 ? '1 hour ' : hours + ' hours ';
        }
        if (minutes > 0) {
            time += minutes === 1 ? '1 minute' : minutes + ' minutes';
        }
        if (hours === 0 && minutes === 0) {
            time = seconds + ' seconds';
        }
        return time;
    },

};

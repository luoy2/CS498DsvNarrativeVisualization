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


    /**
     * Initialize
     */
    init: function (data) {

        // Set calendar data
        calendarHeatmap.data = data;

        // Set calendar color
        calendarHeatmap.color = '#ff4500';
        calendarHeatmap.colorScale = d3.scaleSequential()
            .interpolator(d3.interpolateBuGn)
            .domain([0, 720]);

        // Initialize current overview type and history
        calendarHeatmap.view_type = 'week';
        calendarHeatmap.history = ['week'];
        calendarHeatmap.selected = {};
        calendarHeatmap.weekly_avg_minutes = 0

        // Set handler function
        calendarHeatmap.handler = function (val) {
            console.log(val);
        };

        // No transition to start with
        calendarHeatmap.in_transition = false;

        // Create html elementsfor the calendar
        calendarHeatmap.createElements();

        // Parse data for summary details
        calendarHeatmap.getDataStats();

        // Draw the chart
        calendarHeatmap.drawChart();
    },


    /**
     * Create html elements for the calendar
     */
    createElements: function () {
        // Create main html container for the calendar
        var container = document.createElement('div');
        container.className = 'calendar-heatmap';
        document.body.appendChild(container);

        // Create svg element
        var svg = d3.select(container).append('svg')
            .attr('class', 'svg')
        // .attr('viewBox', '0 0 600 2000');

        // Create other svg elements
        calendarHeatmap.items = svg.append('g');
        calendarHeatmap.labels = svg.append('g');
        calendarHeatmap.buttons = svg.append('g');

        // Add tooltip to the same element as main svg
        calendarHeatmap.tooltip = d3.select(container).append('div')
            .attr('class', 'heatmap-tooltip')
            .style('opacity', 0);

        // Calculate dimensions based on available width
        var calcDimensions = function () {

            var dayIndex = Math.round((moment() - moment().subtract(1, 'year').startOf('week')) / 86400000);
            var colIndex = Math.trunc(dayIndex / 7);
            var numWeeks = colIndex + 1;


            calendarHeatmap.settings.width = container.offsetWidth < 1000 ? 1000 : container.offsetWidth;
            calendarHeatmap.settings.item_size = ((calendarHeatmap.settings.width - calendarHeatmap.settings.label_padding) / numWeeks - calendarHeatmap.settings.gutter);
            calendarHeatmap.settings.height = calendarHeatmap.settings.label_padding + 7 * (calendarHeatmap.settings.item_size + calendarHeatmap.settings.gutter) + 50;
            console.log(calendarHeatmap.settings);
            svg.attr('width', calendarHeatmap.settings.width)
                .attr('height', calendarHeatmap.settings.height)

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
        if (!calendarHeatmap.data) {
            return;
        }
        let d = new Date();
        let this_year = new Date(d.getFullYear(), 1, 1)
        let next_year = new Date(d.getFullYear() + 1, 1, 1)
        let all_minutes = data.filter(x => this_year < x.date < next_year).map(x => x.minutes);
        calendarHeatmap.monthly_avg_minutes = average(all_minutes);
        console.log("average minutes: ", calendarHeatmap.monthly_avg_minutes);

        // Get daily summary if that was not provided
    },


    /**
     * Draw the chart based on the current overview type
     */
    drawChart: function () {
        if (calendarHeatmap.view_type === 'year') {
            calendarHeatmap.drawYearOverview();
        } else if (calendarHeatmap.view_type === 'month') {
            calendarHeatmap.drawMonthOverview();
        } else if (calendarHeatmap.view_type === 'week') {
            calendarHeatmap.drawWeekOverview();
        }
    },


    /**
     * Draw year overview
     */
    drawYearOverview: function () {
        // Add current overview to the history
        if (calendarHeatmap.history[calendarHeatmap.history.length - 1] !== calendarHeatmap.view_type) {
            calendarHeatmap.history.push(calendarHeatmap.view_type);
        }

        var year_ago = moment().startOf('day').subtract(1, 'year');
        var max_value = d3.max(calendarHeatmap.data, function (d) {
            return d.total;
        });
        var color = d3.scale.linear()
            .range(['#ffffff', calendarHeatmap.color || '#ff4500'])
            .domain([-0.15 * max_value, max_value]);

        var calcItemX = function (d) {
            var date = moment(d.date);
            var dayIndex = Math.round((date - moment(year_ago).startOf('week')) / 86400000);
            var colIndex = Math.trunc(dayIndex / 7);
            return colIndex * (calendarHeatmap.settings.item_size + calendarHeatmap.settings.gutter) + calendarHeatmap.settings.label_padding;
        };
        var calcItemY = function (d) {
            return calendarHeatmap.settings.label_padding + moment(d.date).weekday() * (calendarHeatmap.settings.item_size + calendarHeatmap.settings.gutter);
        };
        var calcItemSize = function (d) {
            if (max_value <= 0) {
                return calendarHeatmap.settings.item_size;
            }
            return calendarHeatmap.settings.item_size * 0.75 + (calendarHeatmap.settings.item_size * d.total / max_value) * 0.25;
        };

        calendarHeatmap.items.selectAll('.item-circle').remove();
        calendarHeatmap.items.selectAll('.item-circle')
            .data(calendarHeatmap.data)
            .enter()
            .append('rect')
            .attr('class', 'item item-circle')
            .style('opacity', 0)
            .attr('x', function (d) {
                return calcItemX(d) + (calendarHeatmap.settings.item_size - calcItemSize(d)) / 2;
            })
            .attr('y', function (d) {
                return calcItemY(d) + (calendarHeatmap.settings.item_size - calcItemSize(d)) / 2;
            })
            .attr('rx', function (d) {
                return calcItemSize(d);
            })
            .attr('ry', function (d) {
                return calcItemSize(d);
            })
            .attr('width', function (d) {
                return calcItemSize(d);
            })
            .attr('height', function (d) {
                return calcItemSize(d);
            })
            .attr('fill', function (d) {
                return (d.total > 0) ? color(d.total) : 'transparent';
            })
            .on('click', function (d) {
                if (calendarHeatmap.in_transition) {
                    return;
                }

                // Don't transition if there is no data to show
                if (d.total === 0) {
                    return;
                }

                calendarHeatmap.in_transition = true;

                // Set selected date to the one clicked on
                calendarHeatmap.selected = d;

                // Hide tooltip
                calendarHeatmap.hideTooltip();

                // Remove all year overview related items and labels
                calendarHeatmap.removeYearOverview();

                // Redraw the chart
                calendarHeatmap.view_type = 'day';
                calendarHeatmap.drawChart();
            })
            .on('mouseover', function (d) {
                if (calendarHeatmap.in_transition) {
                    return;
                }

                // Pulsating animation
                var circle = d3.select(this);
                (function repeat() {
                    circle = circle.transition()
                        .duration(calendarHeatmap.settings.transition_duration)
                        .ease(d3.easeLinear(1))
                        .attr('x', function (d) {
                            return calcItemX(d) - (calendarHeatmap.settings.item_size * 1.1 - calendarHeatmap.settings.item_size) / 2;
                        })
                        .attr('y', function (d) {
                            return calcItemY(d) - (calendarHeatmap.settings.item_size * 1.1 - calendarHeatmap.settings.item_size) / 2;
                        })
                        .attr('width', calendarHeatmap.settings.item_size * 1.1)
                        .attr('height', calendarHeatmap.settings.item_size * 1.1)
                        .transition()
                        .duration(calendarHeatmap.settings.transition_duration)
                        .ease(d3.easeLinear(1))
                        .attr('x', function (d) {
                            return calcItemX(d) + (calendarHeatmap.settings.item_size - calcItemSize(d)) / 2;
                        })
                        .attr('y', function (d) {
                            return calcItemY(d) + (calendarHeatmap.settings.item_size - calcItemSize(d)) / 2;
                        })
                        .attr('width', function (d) {
                            return calcItemSize(d);
                        })
                        .attr('height', function (d) {
                            return calcItemSize(d);
                        })
                        .each('end', repeat);
                })();

                // Construct tooltip
                var tooltip_html = '';
                tooltip_html += '<div class="header"><strong>' + (d.total ? calendarHeatmap.formatTime(d.total) : 'No time') + ' tracked</strong></div>';
                tooltip_html += '<div>on ' + moment(d.date).format('dddd, MMM Do YYYY') + '</div><br>';

                // Add summary to the tooltip
                for (var i = 0; i < d.summary.length; i++) {
                    tooltip_html += '<div><span><strong>' + d.summary[i].name + '</strong></span>';
                    tooltip_html += '<span>' + calendarHeatmap.formatTime(d.summary[i].value) + '</span></div>';
                }
                ;

                // Calculate tooltip position
                var x = calcItemX(d) + calendarHeatmap.settings.item_size;
                if (calendarHeatmap.settings.width - x < (calendarHeatmap.settings.tooltip_width + calendarHeatmap.settings.tooltip_padding * 3)) {
                    x -= calendarHeatmap.settings.tooltip_width + calendarHeatmap.settings.tooltip_padding * 2;
                }
                var y = calcItemY(d) + calendarHeatmap.settings.item_size;

                // Show tooltip
                calendarHeatmap.tooltip.html(tooltip_html)
                    .style('left', x + 'px')
                    .style('top', y + 'px')
                    .transition()
                    .duration(calendarHeatmap.settings.transition_duration / 2)
                    .ease(d3.easeLinear(1))
                    .style('opacity', 1);
            })
            .on('mouseout', function () {
                if (calendarHeatmap.in_transition) {
                    return;
                }

                // Set circle radius back to what it's supposed to be
                d3.select(this).transition()
                    .duration(calendarHeatmap.settings.transition_duration / 2)
                    .ease(d3.easeLinear(1))
                    .attr('x', function (d) {
                        return calcItemX(d) + (calendarHeatmap.settings.item_size - calcItemSize(d)) / 2;
                    })
                    .attr('y', function (d) {
                        return calcItemY(d) + (calendarHeatmap.settings.item_size - calcItemSize(d)) / 2;
                    })
                    .attr('width', function (d) {
                        return calcItemSize(d);
                    })
                    .attr('height', function (d) {
                        return calcItemSize(d);
                    });

                // Hide tooltip
                calendarHeatmap.hideTooltip();
            })
            .transition()
            .delay(function () {
                return (Math.cos(Math.PI * Math.random()) + 1) * calendarHeatmap.settings.transition_duration;
            })
            .duration(function () {
                return calendarHeatmap.settings.transition_duration;
            })
            .ease(d3.easeLinear(1))
            .style('opacity', 1)
            .call(function (transition, callback) {
                if (transition.empty()) {
                    callback();
                }
                var n = 0;
                transition
                    .each(function () {
                        ++n;
                    })
                    .each('end', function () {
                        if (!--n) {
                            callback.apply(this, arguments);
                        }
                    });
            }, function () {
                calendarHeatmap.in_transition = false;
            });

        // Add month labels
        var today = moment().endOf('day');
        var today_year_ago = moment().startOf('day').subtract(1, 'year');
        var month_labels = d3.time.months(today_year_ago.startOf('month'), today);
        var monthScale = d3.scale.linear()
            .range([0, calendarHeatmap.settings.width])
            .domain([0, month_labels.length]);
        calendarHeatmap.labels.selectAll('.label-month').remove();
        calendarHeatmap.labels.selectAll('.label-month')
            .data(month_labels)
            .enter()
            .append('text')
            .attr('class', 'label label-month')
            .attr('font-size', function () {
                return Math.floor(calendarHeatmap.settings.label_padding / 3) + 'px';
            })
            .text(function (d) {
                return d.toLocaleDateString('en-us', {month: 'short'});
            })
            .attr('x', function (d, i) {
                return monthScale(i) + (monthScale(i) - monthScale(i - 1)) / 2;
            })
            .attr('y', calendarHeatmap.settings.label_padding / 2)
            .on('mouseenter', function (d) {
                if (calendarHeatmap.in_transition) {
                    return;
                }

                var selected_month = moment(d);
                calendarHeatmap.items.selectAll('.item-circle')
                    .transition()
                    .duration(calendarHeatmap.settings.transition_duration)
                    .ease(d3.easeLinear(1))
                    .style('opacity', function (d) {
                        return moment(d.date).isSame(selected_month, 'month') ? 1 : 0.1;
                    });
            })
            .on('mouseout', function () {
                if (calendarHeatmap.in_transition) {
                    return;
                }

                calendarHeatmap.items.selectAll('.item-circle')
                    .transition()
                    .duration(calendarHeatmap.settings.transition_duration)
                    .ease(d3.easeLinear(1))
                    .style('opacity', 1);
            })
            .on('click', function (d) {
                if (calendarHeatmap.in_transition) {
                    return;
                }

                // Check month data
                var month_data = calendarHeatmap.data.filter(function (e) {
                    return moment(d).startOf('month') <= moment(e.date) && moment(e.date) < moment(d).endOf('month');
                });

                // Don't transition if there is no data to show
                if (!month_data.length) {
                    return;
                }

                // Set selected month to the one clicked on
                calendarHeatmap.selected = {date: d};

                calendarHeatmap.in_transition = true;

                // Hide tooltip
                calendarHeatmap.hideTooltip();

                // Remove all year overview related items and labels
                calendarHeatmap.removeYearOverview();

                // Redraw the chart
                calendarHeatmap.view_type = 'month';
                calendarHeatmap.drawChart();
            });

        // Add day labels
        var day_labels = d3.time.days(moment().startOf('week'), moment().endOf('week'));
        var dayScale = d3.scale.ordinal()
            .rangeRoundBands([calendarHeatmap.settings.label_padding, calendarHeatmap.settings.height])
            .domain(day_labels.map(function (d) {
                return moment(d).weekday();
            }));
        calendarHeatmap.labels.selectAll('.label-day').remove();
        calendarHeatmap.labels.selectAll('.label-day')
            .data(day_labels)
            .enter()
            .append('text')
            .attr('class', 'label label-day')
            .attr('x', calendarHeatmap.settings.label_padding / 3)
            .attr('y', function (d, i) {
                return dayScale(i) + dayScale.rangeBand() / 1.75;
            })
            .style('text-anchor', 'left')
            .attr('font-size', function () {
                return Math.floor(calendarHeatmap.settings.label_padding / 3) + 'px';
            })
            .text(function (d) {
                return moment(d).format('dddd')[0];
            })
            .on('mouseenter', function (d) {
                if (calendarHeatmap.in_transition) {
                    return;
                }

                var selected_day = moment(d);
                calendarHeatmap.items.selectAll('.item-circle')
                    .transition()
                    .duration(calendarHeatmap.settings.transition_duration)
                    .ease(d3.easeLinear(1))
                    .style('opacity', function (d) {
                        return (moment(d.date).day() === selected_day.day()) ? 1 : 0.1;
                    });
            })
            .on('mouseout', function () {
                if (calendarHeatmap.in_transition) {
                    return;
                }

                calendarHeatmap.items.selectAll('.item-circle')
                    .transition()
                    .duration(calendarHeatmap.settings.transition_duration)
                    .ease(d3.easeLinear(1))
                    .style('opacity', 1);
            });
    },


    /**
     * Draw month overview
     */
    drawMonthOverview: function () {
        // Add current overview to the history
        if (calendarHeatmap.history[calendarHeatmap.history.length - 1] !== calendarHeatmap.view_type) {
            calendarHeatmap.history.push(calendarHeatmap.view_type);
        }

        // Define beginning and end of the month
        var start_of_month = moment(calendarHeatmap.selected.date).startOf('month');
        var end_of_month = moment(calendarHeatmap.selected.date).endOf('month');

        // Filter data down to the selected month
        var month_data = calendarHeatmap.data.filter(function (d) {
            return start_of_month <= moment(d.date) && moment(d.date) < end_of_month;
        });
        var max_value = d3.max(month_data, function (d) {
            return d3.max(d.summary, function (d) {
                return d.value;
            });
        });

        // Define day labels and axis
        var day_labels = d3.time.days(moment().startOf('week'), moment().endOf('week'));
        var dayScale = d3.scale.ordinal()
            .rangeRoundBands([calendarHeatmap.settings.label_padding, calendarHeatmap.settings.height])
            .domain(day_labels.map(function (d) {
                return moment(d).weekday();
            }));

        // Define week labels and axis
        var week_labels = [start_of_month.clone()];
        while (start_of_month.week() !== end_of_month.week()) {
            week_labels.push(start_of_month.add(1, 'week').clone());
        }
        var weekScale = d3.scale.ordinal()
            .rangeRoundBands([calendarHeatmap.settings.label_padding, calendarHeatmap.settings.width], 0.05)
            .domain(week_labels.map(function (weekday) {
                return weekday.week();
            }));

        // Add month data items to the overview
        calendarHeatmap.items.selectAll('.item-block-month').remove();
        var item_block = calendarHeatmap.items.selectAll('.item-block-month')
            .data(month_data)
            .enter()
            .append('g')
            .attr('class', 'item item-block-month')
            .attr('width', function () {
                return (calendarHeatmap.settings.width - calendarHeatmap.settings.label_padding) / week_labels.length - calendarHeatmap.settings.gutter * 5;
            })
            .attr('height', function () {
                return Math.min(dayScale.rangeBand(), calendarHeatmap.settings.max_block_height);
            })
            .attr('transform', function (d) {
                return 'translate(' + weekScale(moment(d.date).week()) + ',' + ((dayScale(moment(d.date).weekday()) + dayScale.rangeBand() / 1.75) - 15) + ')';
            })
            .attr('total', function (d) {
                return d.total;
            })
            .attr('date', function (d) {
                return d.date;
            })
            .attr('offset', 0)
            .on('click', function (d) {
                if (calendarHeatmap.in_transition) {
                    return;
                }

                // Don't transition if there is no data to show
                if (d.total === 0) {
                    return;
                }

                calendarHeatmap.in_transition = true;

                // Set selected date to the one clicked on
                calendarHeatmap.selected = d;

                // Hide tooltip
                calendarHeatmap.hideTooltip();

                // Remove all month overview related items and labels
                calendarHeatmap.removeMonthOverview();

                // Redraw the chart
                calendarHeatmap.view_type = 'day';
                calendarHeatmap.drawChart();
            });

        var item_width = (calendarHeatmap.settings.width - calendarHeatmap.settings.label_padding) / week_labels.length - calendarHeatmap.settings.gutter * 5;
        var itemScale = d3.scale.linear()
            .rangeRound([0, item_width]);

        item_block.selectAll('.item-block-rect')
            .data(function (d) {
                return d.summary;
            })
            .enter()
            .append('rect')
            .attr('class', 'item item-block-rect')
            .attr('x', function (d) {
                var total = parseInt(d3.select(this.parentNode).attr('total'));
                var offset = parseInt(d3.select(this.parentNode).attr('offset'));
                itemScale.domain([0, total]);
                d3.select(this.parentNode).attr('offset', offset + itemScale(d.value));
                return offset;
            })
            .attr('width', function (d) {
                var total = parseInt(d3.select(this.parentNode).attr('total'));
                itemScale.domain([0, total]);
                return Math.max((itemScale(d.value) - calendarHeatmap.settings.item_gutter), 1)
            })
            .attr('height', function () {
                return Math.min(dayScale.rangeBand(), calendarHeatmap.settings.max_block_height);
            })
            .attr('fill', function (d) {
                var color = d3.scale.linear()
                    .range(['#ffffff', calendarHeatmap.color || '#ff4500'])
                    .domain([-0.15 * max_value, max_value]);
                return color(d.value) || '#ff4500';
            })
            .style('opacity', 0)
            .on('mouseover', function (d) {
                if (calendarHeatmap.in_transition) {
                    return;
                }

                // Get date from the parent node
                var date = new Date(d3.select(this.parentNode).attr('date'));

                // Construct tooltip
                var tooltip_html = '';
                tooltip_html += '<div class="header"><strong>' + d.name + '</strong></div><br>';
                tooltip_html += '<div><strong>' + (d.value ? calendarHeatmap.formatTime(d.value) : 'No time') + ' tracked</strong></div>';
                tooltip_html += '<div>on ' + moment(date).format('dddd, MMM Do YYYY') + '</div>';

                // Calculate tooltip position
                var x = weekScale(moment(date).week()) + calendarHeatmap.settings.tooltip_padding;
                while (calendarHeatmap.settings.width - x < (calendarHeatmap.settings.tooltip_width + calendarHeatmap.settings.tooltip_padding * 3)) {
                    x -= 10;
                }
                var y = dayScale(moment(date).weekday()) + calendarHeatmap.settings.tooltip_padding * 2;

                // Show tooltip
                calendarHeatmap.tooltip.html(tooltip_html)
                    .style('left', x + 'px')
                    .style('top', y + 'px')
                    .transition()
                    .duration(calendarHeatmap.settings.transition_duration / 2)
                    .ease(d3.easeLinear(1))
                    .style('opacity', 1);
            })
            .on('mouseout', function () {
                if (calendarHeatmap.in_transition) {
                    return;
                }
                calendarHeatmap.hideTooltip();
            })
            .transition()
            .delay(function () {
                return (Math.cos(Math.PI * Math.random()) + 1) * calendarHeatmap.settings.transition_duration;
            })
            .duration(function () {
                return calendarHeatmap.settings.transition_duration;
            })
            .ease(d3.easeLinear(1))
            .style('opacity', 1)
            .call(function (transition, callback) {
                if (transition.empty()) {
                    callback();
                }
                var n = 0;
                transition
                    .each(function () {
                        ++n;
                    })
                    .each('end', function () {
                        if (!--n) {
                            callback.apply(this, arguments);
                        }
                    });
            }, function () {
                calendarHeatmap.in_transition = false;
            });

        // Add week labels
        calendarHeatmap.labels.selectAll('.label-week').remove();
        calendarHeatmap.labels.selectAll('.label-week')
            .data(week_labels)
            .enter()
            .append('text')
            .attr('class', 'label label-week')
            .attr('font-size', function () {
                return Math.floor(calendarHeatmap.settings.label_padding / 3) + 'px';
            })
            .text(function (d) {
                return 'Week ' + d.week();
            })
            .attr('x', function (d) {
                return weekScale(d.week());
            })
            .attr('y', calendarHeatmap.settings.label_padding / 2)
            .on('mouseenter', function (weekday) {
                if (calendarHeatmap.in_transition) {
                    return;
                }

                calendarHeatmap.items.selectAll('.item-block-month')
                    .transition()
                    .duration(calendarHeatmap.settings.transition_duration)
                    .ease(d3.easeLinear(1))
                    .style('opacity', function (d) {
                        return (moment(d.date).week() === weekday.week()) ? 1 : 0.1;
                    });
            })
            .on('mouseout', function () {
                if (calendarHeatmap.in_transition) {
                    return;
                }

                calendarHeatmap.items.selectAll('.item-block-month')
                    .transition()
                    .duration(calendarHeatmap.settings.transition_duration)
                    .ease(d3.easeLinear(1))
                    .style('opacity', 1);
            })
            .on('click', function (d) {
                if (calendarHeatmap.in_transition) {
                    return;
                }

                // Check week data
                var week_data = calendarHeatmap.data.filter(function (e) {
                    return d.startOf('week') <= moment(e.date) && moment(e.date) < d.endOf('week');
                });

                // Don't transition if there is no data to show
                if (!week_data.length) {
                    return;
                }

                calendarHeatmap.in_transition = true;

                // Set selected month to the one clicked on
                calendarHeatmap.selected = {date: d};

                // Hide tooltip
                calendarHeatmap.hideTooltip();

                // Remove all year overview related items and labels
                calendarHeatmap.removeMonthOverview();

                // Redraw the chart
                calendarHeatmap.view_type = 'week';
                calendarHeatmap.drawChart();
            });


        // Add day labels
        calendarHeatmap.labels.selectAll('.label-day').remove();
        calendarHeatmap.labels.selectAll('.label-day')
            .data(day_labels)
            .enter()
            .append('text')
            .attr('class', 'label label-day')
            .attr('x', calendarHeatmap.settings.label_padding / 3)
            .attr('y', function (d, i) {
                return dayScale(i) + dayScale.rangeBand() / 1.75;
            })
            .style('text-anchor', 'left')
            .attr('font-size', function () {
                return Math.floor(calendarHeatmap.settings.label_padding / 3) + 'px';
            })
            .text(function (d) {
                return moment(d).format('dddd')[0];
            })
            .on('mouseenter', function (d) {
                if (calendarHeatmap.in_transition) {
                    return;
                }

                var selected_day = moment(d);
                calendarHeatmap.items.selectAll('.item-block-month')
                    .transition()
                    .duration(calendarHeatmap.settings.transition_duration)
                    .ease(d3.easeLinear(1))
                    .style('opacity', function (d) {
                        return (moment(d.date).day() === selected_day.day()) ? 1 : 0.1;
                    });
            })
            .on('mouseout', function () {
                if (calendarHeatmap.in_transition) {
                    return;
                }

                calendarHeatmap.items.selectAll('.item-block-month')
                    .transition()
                    .duration(calendarHeatmap.settings.transition_duration)
                    .ease(d3.easeLinear(1))
                    .style('opacity', 1);
            });

        // Add button to switch back to year overview
        calendarHeatmap.drawButton();
    },


    /**
     * Draw week overview
     */
    drawWeekOverview: function () {
        // Add current overview to the history
        if (calendarHeatmap.history[calendarHeatmap.history.length - 1] !== calendarHeatmap.view_type) {
            calendarHeatmap.history.push(calendarHeatmap.view_type);
        }

        // Define beginning and end of the week
        var start_of_week = moment(calendarHeatmap.selected.date).startOf('week');
        var end_of_week = moment(calendarHeatmap.selected.date).endOf('week');

        // Filter data down to the selected week
        var week_data = calendarHeatmap.data.filter(function (d) {
            return start_of_week <= moment(d.date) && moment(d.date) < end_of_week;
        });
        console.log("week data: ", week_data);

        // Add time labels

        var timeLabels = d3.timeHours(moment().startOf('day'), moment().endOf('day'));
        var timeScale = d3.scaleTime()
            .range([calendarHeatmap.settings.label_padding * 2, calendarHeatmap.settings.width])
            .domain([0, 24*60*60]);
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
                if (calendarHeatmap.in_transition) {
                    return;
                }

                calendarHeatmap.items.selectAll('.item-block')
                    .transition()
                    .duration(calendarHeatmap.settings.transition_duration)
                    .ease(d3.easeLinear(1))
            })
            .on('mouseout', function () {
                if (calendarHeatmap.in_transition) {
                    return;
                }

                calendarHeatmap.items.selectAll('.item-block')
                    .transition()
                    .duration(calendarHeatmap.settings.transition_duration)
                    .ease(d3.easeLinear(1))
                    .style('opacity', 0.5);
            });


        var day_labels = d3.timeDays(moment().startOf('week'), moment().endOf('week'));
        var dayScale = d3.scaleBand()
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

                calendarHeatmap.items.selectAll('.item-block-week')
                    .transition()
                    .duration(calendarHeatmap.settings.transition_duration)
                    .ease(d3.easeLinear(1))
            })
            .on('mouseout', function () {
                if (calendarHeatmap.in_transition) {
                    return;
                }

                calendarHeatmap.items.selectAll('.item-block-week')
                    .transition()
                    .duration(calendarHeatmap.settings.transition_duration)
                    .ease(d3.easeLinear(1))
                    .style('opacity', 1);
            });


        // Define week labels and axis
        var week_labels = [start_of_week];
        var weekScale = d3.scaleBand()
            .rangeRound([calendarHeatmap.settings.label_padding, calendarHeatmap.settings.width], 0.01)
            .domain(week_labels.map(function (weekday) {
                return weekday.week();
            }));

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
                let start = timeScale(d.start_time.getHours()*60*60 + d.start_time.getMinutes()*60 + d.start_time.getSeconds())
                let end = timeScale(d.end_time.getHours()*60*60 + d.end_time.getMinutes()*60 + d.end_time.getSeconds());
                return Math.max((end - start), 1);
            })
            .attr('height', function () {
                return Math.min(dayScale.bandwidth(), calendarHeatmap.settings.max_block_height);
            })
            .attr('fill', function () {
                return calendarHeatmap.color || '#ff4500';
            })
            // .style('opacity', 0)
            // .on('mouseover', function(d) {
            //     if ( calendarHeatmap.in_transition ) { return; }
            //
            //     // Construct tooltip
            //     var tooltip_html = '';
            //     tooltip_html += '<div class="header"><strong>' + d.name + '</strong><div><br>';
            //     tooltip_html += '<div><strong>' + (d.value ? calendarHeatmap.formatTime(d.value) : 'No time') + ' tracked</strong></div>';
            //     tooltip_html += '<div>on ' + moment(d.date).format('dddd, MMM Do YYYY HH:mm') + '</div>';
            //
            //     // Calculate tooltip position
            //     var x = d.value * 100 / (60 * 60 * 24) + itemScale(moment(d.date));
            //     while ( calendarHeatmap.settings.width - x < (calendarHeatmap.settings.tooltip_width + calendarHeatmap.settings.tooltip_padding * 3) ) {
            //         x -= 10;
            //     }
            //     var y = projectScale(d.name) + projectScale.rangeBand() / 2 + calendarHeatmap.settings.tooltip_padding / 2;
            //
            //     // Show tooltip
            //     calendarHeatmap.tooltip.html(tooltip_html)
            //         .style('left', x + 'px')
            //         .style('top', y + 'px')
            //         .transition()
            //         .duration(calendarHeatmap.settings.transition_duration / 2)
            //         .ease(d3.easeLinear(1))
            //         .style('opacity', 1);
            // })
            // .on('mouseout', function () {
            //     if ( calendarHeatmap.in_transition ) { return; }
            //     calendarHeatmap.hideTooltip();
            // })
            // .on('click', function (d) {
            //     if ( !!calendarHeatmap.handler && typeof calendarHeatmap.handler == 'function' ) {
            //         calendarHeatmap.handler(d);
            //     }
            // })
            // .transition()
            // .delay(function () {
            //     return (Math.cos(Math.PI * Math.random()) + 1) * calendarHeatmap.settings.transition_duration;
            // })
            // .duration(function () {
            //     return calendarHeatmap.settings.transition_duration;
            // })
            // .ease(d3.easeLinear(1))
            // .style('opacity', 0.5)
            // .call(function (transition, callback) {
            //     if ( transition.empty() ) {
            //         callback();
            //     }
            //     var n = 0;
            //     transition
            //         .each(function() { ++n; })
            //         .each('end', function() {
            //             if ( !--n ) {
            //                 callback.apply(this, arguments);
            //             }
            //         });
            // }, function() {
            //     calendarHeatmap.in_transition = false;
            // });

        // Add week labels
        calendarHeatmap.labels.selectAll('.label-week').remove();
        calendarHeatmap.labels.selectAll('.label-week')
            .data(week_labels)
            .enter()
            .append('text')
            .attr('class', 'label label-week')
            .attr('font-size', function () {
                return Math.floor(calendarHeatmap.settings.label_padding / 3) + 'px';
            })
            .text(function (d) {
                return 'Week ' + d.week();
            })
            .attr('x', function (d) {
                return weekScale(d.week());
            })
            .attr('y', calendarHeatmap.settings.label_padding / 2)
            .on('mouseenter', function (weekday) {
                if ( calendarHeatmap.in_transition ) { return; }

                calendarHeatmap.items.selectAll('.item-block-week')
                    .transition()
                    .duration(calendarHeatmap.settings.transition_duration)
                    .ease(d3.easeLinear(1))
                    .style('opacity', function (d) {
                        return ( moment(d.date).week() === weekday.week() ) ? 1 : 0.1;
                    });
            })
            .on('mouseout', function () {
                if ( calendarHeatmap.in_transition ) { return; }

                calendarHeatmap.items.selectAll('.item-block-week')
                    .transition()
                    .duration(calendarHeatmap.settings.transition_duration)
                    .ease(d3.easeLinear(1))
                    .style('opacity', 1);
            });


        // Add button to switch back to year overview
        calendarHeatmap.drawButton();

    },


    /**
     * Draw the button for navigation purposes
     */
    drawButton: function () {
        calendarHeatmap.buttons.selectAll('.button').remove();
        var button = calendarHeatmap.buttons.append('g')
            .attr('class', 'button button-back')
            .style('opacity', 0)
            .on('click', function () {
                if (calendarHeatmap.in_transition) {
                    return;
                }

                // Set transition boolean
                calendarHeatmap.in_transition = true;

                // Clean the canvas from whichever overview type was on
                if (calendarHeatmap.view_type === 'month') {
                    calendarHeatmap.removeMonthOverview();
                } else if (calendarHeatmap.view_type === 'week') {
                    calendarHeatmap.removeWeekOverview();
                } else if (calendarHeatmap.view_type === 'day') {
                    calendarHeatmap.removeDayOverview();
                }

                // Redraw the chart
                calendarHeatmap.history.pop();
                calendarHeatmap.view_type = calendarHeatmap.history.pop();
                calendarHeatmap.drawChart();
            });
        button.append('circle')
            .attr('cx', calendarHeatmap.settings.label_padding / 2.25)
            .attr('cy', calendarHeatmap.settings.label_padding / 2.5)
            .attr('r', calendarHeatmap.settings.item_size / 2);
        button.append('text')
            .attr('x', calendarHeatmap.settings.label_padding / 2.25)
            .attr('y', calendarHeatmap.settings.label_padding / 2.75)
            .attr('dy', function () {
                return Math.floor(calendarHeatmap.settings.width / 100) / 2.5;
            })
            .attr('font-size', function () {
                return Math.floor(calendarHeatmap.settings.label_padding / 3) + 'px';
            })
            .html('&#x2190;');
        button.transition()
            .duration(calendarHeatmap.settings.transition_duration)
            .ease(d3.easeLinear(1))
            .style('opacity', 1);
    },


    /**
     * Transition and remove items and labels related to year overview
     */
    removeYearOverview: function () {
        calendarHeatmap.items.selectAll('.item-circle')
            .transition()
            .duration(calendarHeatmap.settings.transition_duration)
            .ease('ease')
            .style('opacity', 0)
            .remove();
        calendarHeatmap.labels.selectAll('.label-day').remove();
        calendarHeatmap.labels.selectAll('.label-month').remove();
    },


    /**
     * Transition and remove items and labels related to month overview
     */
    removeMonthOverview: function () {
        calendarHeatmap.items.selectAll('.item-block-month').selectAll('.item-block-rect')
            .transition()
            .duration(calendarHeatmap.settings.transition_duration)
            .ease(d3.easeLinear(1))
            .style('opacity', 0)
            .attr('x', function (d, i) {
                return (i % 2 === 0) ? -calendarHeatmap.settings.width / 3 : calendarHeatmap.settings.width / 3;
            })
            .remove();
        calendarHeatmap.labels.selectAll('.label-day').remove();
        calendarHeatmap.labels.selectAll('.label-week').remove();
        calendarHeatmap.hideBackButton();
    },


    /**
     * Transition and remove items and labels related to week overview
     */
    removeWeekOverview: function () {
        calendarHeatmap.items.selectAll('.item-block-week').selectAll('.item-block-rect')
            .transition()
            .duration(calendarHeatmap.settings.transition_duration)
            .ease(d3.easeLinear(1))
            .style('opacity', 0)
            .attr('x', function (d, i) {
                return (i % 2 === 0) ? -calendarHeatmap.settings.width / 3 : calendarHeatmap.settings.width / 3;
            })
            .remove();
        calendarHeatmap.labels.selectAll('.label-day').remove();
        calendarHeatmap.labels.selectAll('.label-week').remove();
        calendarHeatmap.hideBackButton();
    },


    /**
     * Helper function to hide the tooltip
     */
    hideTooltip: function () {
        calendarHeatmap.tooltip.transition()
            .duration(calendarHeatmap.settings.transition_duration / 2)
            .ease(d3.easeLinear(1))
            .style('opacity', 0);
    },


    /**
     * Helper function to hide the back button
     */
    hideBackButton: function () {
        calendarHeatmap.buttons.selectAll('.button')
            .transition()
            .duration(calendarHeatmap.settings.transition_duration)
            .ease('ease')
            .style('opacity', 0)
            .remove();
    },


    /**
     * Helper function to convert seconds to a human readable format
     * @param seconds Integer
     */
    formatTime: function (seconds) {
        var sec_num = parseInt(seconds, 10);
        var hours = Math.floor(sec_num / 3600);
        var minutes = Math.floor((sec_num - (hours * 3600)) / 60);
        var time = '';
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

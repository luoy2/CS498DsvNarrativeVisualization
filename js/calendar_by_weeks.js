function drawCalendar(dateData) {

    var weeksInMonth = function (month) {
        var m = d3.timeMonth.floor(month)
        return d3.timeWeeks(d3.timeWeek.floor(m), d3.timeMonth.offset(m, 1)).length;
    }

    var minDate = d3.min(dateData, function (d) {
        return new Date(d.date)
    })
    var maxDate = d3.max(dateData, function (d) {
        return new Date(d.date)
    })

    var cellMargin = 2,
        cell_size = 20;

    var day = d3.timeFormat("%w"),
        week = d3.timeFormat("%U"),
        format = d3.timeFormat("%Y-%m-%d"),
        titleFormat = d3.utcFormat("%a, %d-%b"),
        monthName = d3.timeFormat("%B"),
        months = d3.timeMonth.range(d3.timeMonth.floor(minDate), maxDate);

    var month_svg = d3.select("#calendar").selectAll("svg")
        .data(months)
        .enter().append("svg")
        .attr("class", "month")
        .attr("height", ((cell_size * 7) + (cellMargin * 8) + 20)) // the 20 is for the month labels
        .attr("width", function (d) {
            var columns = weeksInMonth(d);
            return ((cell_size * columns) + (cellMargin * (columns + 1)));
        })
        .append("g")

    month_svg.append("text")
        .attr("class", "month-name")
        .attr("y", (cell_size * 7) + (cellMargin * 8) + 15)
        .attr("x", function (d) {
            var columns = weeksInMonth(d);
            return (((cell_size * columns) + (cellMargin * (columns + 1))) / 2);
        })
        .attr("text-anchor", "middle")
        .text(function (d) {
            return monthName(d);
        })

    var lookupminutes = d3.nest()
        .key(function(d) { return format(d.date); })
        .rollup(function(leaves) {
            return d3.sum(leaves, function(d){ return parseInt(d.minutes); });
        })
        .object(dateData);

    var lookupdetail = d3.nest()
        .key(function(d) { return d.date; })
        .rollup(function(leaves) {
            return d3.sum(leaves, function(d){ return d.details; })
        })
        .object(dateData);


    var rect = month_svg.selectAll("rect.day")
        .data(function (d, i) {
            return d3.timeDays(d, new Date(d.getFullYear(), d.getMonth() + 1, 1));
        })
        .enter().append("rect")
        .attr("class", "day")
        .attr("width", cell_size)
        .attr("height", cell_size)
        .attr("rx", 3).attr("ry", 3) // rounded corners
        .attr("y", function (d) {
            return (day(d) * cell_size) + (day(d) * cellMargin) + cellMargin;
        })
        .attr("x", function (d) {
            return ((week(d) - week(new Date(d.getFullYear(), d.getMonth(), 1))) * cell_size) + ((week(d) - week(new Date(d.getFullYear(), d.getMonth(), 1))) * cellMargin) + cellMargin;
        })
        .attr("fill", '#eaeaea') // default light grey fill
        .attr("fill", d => colorScale(lookupminutes[format(d)]))
        .on("mouseover", function (d) {
            d3.select(this).classed('hover', true);
        })
        .on("mouseout", function (d) {
            d3.select(this).classed('hover', false);
        })
        .datum(format);

    console.log("dsadasdas!!!!!")
    console.log(rect.data);

    rect.append("title")
        .text(function (d, i) {
            return lookupdetail[d];
        });

    rect.filter(function(d) { return d in lookupminutes; })
        .style("fill", function(d) { return colorScale(lookupminutes[format(d)]); })


}

function log(sel,msg) {
    console.log(msg,sel);
}

const colorScale = d3.scaleSequential()
    .interpolator(d3.interpolateBuGn)
    .domain([0, 720]);


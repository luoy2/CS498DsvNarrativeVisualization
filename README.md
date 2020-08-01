# CS498DsvNarrativeVisualization
## [home page](http://luoy2.github.io/CS498DsvNarrativeVisualization)



### Messaging & Background Story

I am currently working for a side job as a contractor, which got paid by hour each month. At the end of every week, I need to send my employee a detail list of how many hours I have put effort to, and what exactly things I have done. Thus, I came up with this ideas to keep in track what I have earned, as well as for my employee to check my work hours and pay me.

### Narrative Structure

I choose the martini glass to present my working effort.  It will show an overview of **current week** working hours as a bar chart at first; and following the scene change, it will show the working hours, dollars have to be paid, project distributions in order. At the end of the presentation, the viewer can either choose different week to see the presentation again, or hover the mouse to different part of bars to explore more details.



### Visual Structure

the visual structure is a chart box on the top to directly show viewer the graph, with a text description box underneath to provide viewer some more details. 

At the beginning, the graph directly showing a bar chart with x axis as hours and y axis as day names. Then, below the chart there is an animated down arrow draw the viewer's attention to click, and help the viewer to navigate the scene. At each scene, there are animated annotation on the chart, as well as a D3 transition of fade in text showing what is the description of the scene(order by time, wages, work details these 3 aspect of the chart). As for the transition, I use d3 transition animation to remove the previous scene annotation, as well as create new annotation for the current scene. 

At last, the viewer can follow the description to change the chart to an yearly overview chart, such that one can select different week to see the story. 

### Scenes

1. an overview of current week's working hour, with a animated arrow guide viewer to click. The color scale indicates which day works the most of time.

   - annotation: there is no directly annotation at this scene, but user can hover on the bars to see the details.

   - the parameters are the hovering on the day label/ hour label to filter the working time bar. while hovering, the unrelated time bar will change its opacity so that the target bar will be more clear.

     ![image-20200801140325529](C:\Users\Yikang Luo\AppData\Roaming\Typora\typora-user-images\image-20200801140325529.png)

2. the graph started an animated annotation showing on each day how many hours have been contributed, and the descriptive text showing a total count of hours .

   ![image-20200801140255708](C:\Users\Yikang Luo\AppData\Roaming\Typora\typora-user-images\image-20200801140255708.png)

3. The third scene is about the money(which why we work on are side jobs!). The annotations are straight forward, daily salary with total salary this week:

   ![image-20200801140531179](C:\Users\Yikang Luo\AppData\Roaming\Typora\typora-user-images\image-20200801140531179.png)

4. The forth scene is about type of work. I use d3 js to draw different rects to cover on the time bar, so that it will show on each day what typo of weeks I have done. Also, a legend will appear at the top.

   ![image-20200801140656497](C:\Users\Yikang Luo\AppData\Roaming\Typora\typora-user-images\image-20200801140656497.png)

5. The Fifth scene is a "overall" scene for me. It gave me an average weekly working hours in the past year and guide user to hover on the chart to see the information on tooltips. 

6. The last scene is a "Parameter" scene. It change the chart from weekly calendar to a yearly calendar, and use color scale on each rectangle to show the different working hours on each day. It allow user to select one day and then describe that week of work as before(repeat from 1 to 5)

   - Parameter: day of week to see the working hour/type details.

- **Triggers.**  

  1.  a css animated arrow once the chart was fully loaded. it draw view's attention to click, and after click, it will guide user to the next scene.

  2. at the last scene, the monthly calendar view, the trigger are each day rectangle block. once it was clicked, it will go to that week's data and repeat the narrative process.



#### reference

I have never coded js before, but luckily they have been a lot of open source project out there. Thus, I put the resource url I have used here

https://codepen.io/g1eb/full/KWXzLR

https://bl.ocks.org/danbjoseph/13d9365450c27ed3bf5a568721296dcc

https://cssanimation.rocks/scroll-cue/
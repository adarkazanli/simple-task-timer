var displaying_task = -1;

// Add a task
function add_task(data) {
    tasks[task_count] = data;
    task_running[task_count] = false;
    task_count++;
    
    list_task(task_count - 1, (task_count - 1 == 0 ? 1 : 2));
    rebuild_totals();
}

// Reset a task
function reset_task(task, override) {
    try {
        dialog(locale('confResetTask', tasks[task].text), function(status, data) {
            var task = data.task;

            if(status) {
                tasks[task].current_hours = tasks[task].current_mins = tasks[task].current_secs = 0;
                tasks[task].notified = false;
                rebuild_list();
                rebuild_totals();
                
                // Enable the task info toggle button
                if(displaying_task == task) $('#task-toggle').removeAttr('disabled');
            }
        }, {'task': task}, 'question', override || !Setting('confirm-reset'));
    } catch(e) {
        js_error(e);
    }
}

// Delete a task
function delete_task(task, override) {
    try {
        dialog(locale('confDeleteTask', tasks[task].text), function(status, data) {
            var task = data.task;

            if(status) {
                load.show();
                $('#new-btn, #task-'+ task +' button').attr('disabled', 'disabled');
                $('#task-'+ task +' img').addClass('disabled');
                $('table#task-list tbody tr').addClass('nodrag nodrop');
                $('table#task-list').tableDnDUpdate();
                
                if(task_running[task]) toggle_task(task);
                
                tasks.splice(task, 1);
                task_running.splice(task, 1);
                task_count--;
                
                // Animate accordingly.
                setTimeout(function() {
                    if(task_count == 0) {
                        $('#edit-tasks').fadeOut();
                        $('table#task-list').fadeOut(400, function() {
                            $('table#task-list tbody').empty();
                            $('#no-tasks').fadeIn();
                            
                            $('#new-btn').removeAttr('disabled');
                        });
                    } else {
                        $('#task-'+ task).fadeOut(400, function() {
                            rebuild_list();
                            $('#new-btn').removeAttr('disabled');
                        });
                    }
                    
                    if(task_count >= 2) $('table#task-list tfoot').fadeIn(); else $('table#task-list tfoot').fadeOut();
                }, 20);
                
                SaveTasks();
                $('#new-txt').focus();
                load.hide();
            }
        }, {'task': task}, 'question', override || !Setting('confirm-delete'));
    } catch(e) {
        js_error(e);
    }
}

// Clear a task's history
function clear_history(task) {
    dialog(locale('confClearHistory', tasks[task].text), function(status, data) {
        if(status) {
            tasks[data.task].history = {};
        }
    }, {'task': task}, 'question');
}

// Toggle whether a task is running or not
function toggle_task(task) {
    try {
        if(task_running[task]) {
            task_running[task] = false;
            $('#task-'+ task +' button.toggle').text(locale('btnStart'));
            $('#task-'+ task +' img.toggle').attr('title', locale('btnStart')).attr('src', 'style/images/control_play_blue.png');
            if(displaying_task == task) $('#task-toggle').text(locale('btnStart'));
            $('#task-'+ task).removeClass('running');
        } else {
            // Disable other tasks if they have it set to allow only one running at a time
            if(Setting('only-one')) {
                for(i = 0; i < task_count; i++) {
                    if(task_running[i]) toggle_task(i);
                }
            }
            
            task_running[task] = true;
            $('#task-'+ task +' button.toggle').text(locale('btnStop'));
            $('#task-'+ task +' img.toggle').attr('title', locale('btnStop')).attr('src', 'style/images/control_stop_blue.png');
            if(displaying_task == task) $('#task-toggle').text(locale('btnStop'));
            $('#task-'+ task).addClass('running');
        }
    } catch(e) {
        js_error(e);
    }
}

// Add the task to the list
function list_task(task, anim) {
    try {
        // Progress done
        var progress = Math.floor((tasks[task].current_hours + (tasks[task].current_mins / 60) + (tasks[task].current_secs / 3600)) / (tasks[task].goal_hours + (tasks[task].goal_mins / 60)) * 100);
        if(tasks[task].indefinite == true) progress = 0;
        if(progress == Infinity) progress = 100;
        
        // Create the row
        $('#row-template').clone().attr('id', 'task-'+ task).appendTo('table#task-list tbody');
        if(task_running[task]) $('#task-'+ task).addClass('running');
        
        // Text
        $('#task-'+ task +' td.text').text(tasks[task].text);
        $('#task-'+ task +' td.current').text(format_time(tasks[task].current_hours, tasks[task].current_mins, tasks[task].current_secs));
        $('#task-'+ task +' td.goal').text(format_time(tasks[task].goal_hours, tasks[task].goal_mins, 0, tasks[i].indefinite));
        $('#task-'+ task +' button.toggle').text(task_running[task] ? locale('btnStop') : locale('btnStart'));
        $('#task-'+ task +' img.toggle').attr('title', task_running[task] ? locale('btnStop') : locale('btnStart')).attr('src', 'style/images/control_'+ (task_running[task] ? 'stop' : 'play') +'_blue.png');
        
        // Progress bar
        if(!tasks[task].indefinite) {
            $('#task-'+ task +' progress').val(progress).text(progress + '%').attr('max', '100');
        } else {
            $('#task-'+ task +' progress').removeAttr('value').removeAttr('max').text('...');
        }
        
        // Option Buttons
        $('#task-'+ task +' .toggle').attr('name', task).click(function() {
            if(!$(this).hasClass('disabled')) toggle_task(parseInt($(this).attr('name')));
        });
        $('#task-'+ task +' .info').attr('name', task).click(function() {
            if(!$(this).hasClass('disabled')) task_info(parseInt($(this).attr('name')));
        });
        $('#task-'+ task +' .reset').attr('name', task).click(function() {
            if(!$(this).hasClass('disabled')) reset_task(parseInt($(this).attr('name')));
        });
        $('#task-'+ task +' .delete').attr('name', task).click(function() {
            if(!$(this).hasClass('disabled')) {
                cancel_edit();
                delete_task(parseInt($(this).attr('name')));
            }
        });
        
        // Change the buttons to icons if the setting is enabled
        if(Setting('use-icons')) {
            $('#task-'+ task +' .button-btns').hide();
            $('#task-'+ task +' .img-btns').show();
        }
        
        // In-line editing events
        $('#task-'+ task +' td.text').dblclick(function() {
            edit_name(parseInt($(this).parent().attr('id').replace('task-', '')));
        });
        $('#task-'+ task +' td.current').dblclick(function() {
            edit_current(parseInt($(this).parent().attr('id').replace('task-', '')));
        });
        $('#task-'+ task +' td.goal').dblclick(function() {
            edit_goal(parseInt($(this).parent().attr('id').replace('task-', '')));
        });
        
        // Disable the toggle button if task is at its goal, and change the bg colour
        if(!tasks[task].indefinite && tasks[task].current_hours >= tasks[task].goal_hours && tasks[task].current_mins >= tasks[task].goal_mins) {
            if(Setting('no-overtime')) {
                $('#task-'+ task +' button.toggle').attr('disabled', 'disabled');
                $('#task-'+ task +' img.toggle').attr('src', 'style/images/control_play.png').addClass('disabled');
            }
            
            $('#task-'+ task).addClass('done');
        }
        
        // Update task menu if it's shown for this task
        if(displaying_task == task) task_info(task, false, progress);
        
        // Animation
        if(anim == 0) {
            // Show instantly
            $('#no-tasks').hide();
            $('#edit-tasks, table#task-list, #task-'+ task).show();
        } else if(anim == 1) {
            // Fade all at once
            $('#task-'+ task).show();
            $('#no-tasks').fadeOut(400, function() {
                $('#edit-tasks, table#task-list').fadeIn();
            });
        } else {
            // Fade in
            $('#task-'+ task).fadeIn();
        }
    } catch(e) {
        js_error(e);
    }
}

// Display information about a specific task in a menu
function task_info(task, anim, progress) {
    try {
        displaying_task = task;
        task_open = true;
        
        // Text
        $('td#info-name').text(tasks[task].text);
        $('td#info-current').text(format_time(tasks[task].current_hours, tasks[task].current_mins, tasks[task].current_secs));
        $('td#info-goal').text(format_time(tasks[task].goal_hours, tasks[task].goal_mins, 0, tasks[task].indefinite));
        
        // Progress done
        if(typeof progress == 'undefined') {
            var progress = Math.floor((tasks[task].current_hours + (tasks[task].current_mins / 60) + (tasks[task].current_secs / 3600)) / (tasks[task].goal_hours + (tasks[task].goal_mins / 60)) * 100);
            if(tasks[task].indefinite == true) progress = 0;
            if(progress == Infinity) progress = 100;
        }
        
        // Progress bar
        if(!tasks[task].indefinite) {
            $('td#info-progress progress').val(progress).text(progress + '%').attr('max', '100');
        } else {
            $('td#info-progress progress').removeAttr('value').removeAttr('max').text('...');
        }

        // Description
        $('#info-description textarea').val(tasks[task].description);
        $('#save-description').attr('name', task);
        
        // Option Buttons
        $('button#task-toggle, button#task-reset, button#task-delete, button#task-clear-history').attr('name', task);
        if($('tr#task-'+ task +' button.toggle').attr('disabled')) $('#task-toggle').attr('disabled', 'disabled'); else $('#task-toggle').removeAttr('disabled');
        
        // Disable the toggle button if task is at its goal, and change the bg colour
        if(!tasks[task].indefinite && tasks[task].current_hours >= tasks[task].goal_hours && tasks[task].current_mins >= tasks[task].goal_mins && Setting('no-overtime')) {
            $('#task-toggle').attr('disabled', 'disabled');
        }
        
        // Show menu
        if(typeof anim == 'undefined' || anim) {
            $('#history-info').text(locale('txtSelectDate')).show();
            $('#history').hide();
            
            $('#modal').fadeIn(600);
            $('#task-menu').animate({left: ((($(window).width() - $('#task-menu').outerWidth(true)) / $(window).width()) * 100).toString() + '%'}, 600);
        }
    } catch(e) {
        js_error(e);
    }
}

// Display the history for a task
function show_history(y, m, d) {
    try {
        if(typeof tasks[displaying_task].history != 'undefined' && typeof tasks[displaying_task].history[y] != 'undefined' && typeof tasks[displaying_task].history[y][m - 1] != 'undefined' && typeof tasks[displaying_task].history[y][m - 1][d] != 'undefined') {
            // Clear out the list, and show it
            $('#history tbody').empty();
            $('#history-info').fadeOut(400, function() {
                $('#history').fadeIn(400);
            });
            
            // Make a row for each hour that there was time spent
            for(h = 0; h <= 23; h++) {
                if(typeof tasks[displaying_task].history[y][m - 1][d][h] != 'undefined') {
                    $('<tr />')
                        .append('<td>'+ format_time(h, 0, 0) +'</td>')
                        .append('<td>'+ format_time(tasks[displaying_task].history[y][m - 1][d][h].hours, tasks[displaying_task].history[y][m - 1][d][h].mins, tasks[displaying_task].history[y][m - 1][d][h].secs) +'</td>')
                        .appendTo('#history tbody')
                    ;
                }
            }
        } else {
            // No history for that day
            $('#history').fadeOut(400, function() {
                $('#history-info').text(locale('txtNoHistory')).fadeIn(400);
            });
        }
    } catch(e) {
        js_error(e);
    }
}

// Increase the current time on tasks that are running by a second
function update_time() {
    try {
        // Get the real time
        if(Setting('track-history')) {
            now = new Date();
            var year = now.getFullYear(), month = now.getMonth(), day = now.getDate(), hour = now.getHours();
        }
        
        // Go through the tasks array
        for(var i = 0; i < task_count; i++) {
            if(task_running[i]) {
                // Increment time
                tasks[i].current_secs += Setting('update-time');
                if(tasks[i].current_secs >= 60) { tasks[i].current_secs -= 60; tasks[i].current_mins++; }
                if(tasks[i].current_mins >= 60) { tasks[i].current_mins -= 60; tasks[i].current_hours++; }
                
                // Historical time
                if(Setting('track-history')) {
                    // Make sure the object exists all the way down
                    if(typeof tasks[i].history == 'undefined') tasks[i].history = {};
                    if(typeof tasks[i].history[year] == 'undefined') tasks[i].history[year] = {};
                    if(typeof tasks[i].history[year][month] == 'undefined') tasks[i].history[year][month] = {};
                    if(typeof tasks[i].history[year][month][day] == 'undefined') tasks[i].history[year][month][day] = {};
                    if(typeof tasks[i].history[year][month][day][hour] == 'undefined') tasks[i].history[year][month][day][hour] = {secs: 0, mins: 0, hours: 0};
                    
                    // Increment the historical time
                    tasks[i].history[year][month][day][hour].secs++;
                    if(tasks[i].history[year][month][day][hour].secs >= 60) { tasks[i].history[year][month][day][hour].secs -= 60; tasks[i].history[year][month][day][hour].mins++; }
                    if(tasks[i].history[year][month][day][hour].mins >= 60) { tasks[i].history[year][month][day][hour].mins -= 60; tasks[i].history[year][month][day][hour].hours++; }
                }
                
                // Task meets its goal
                if(!tasks[i].indefinite && tasks[i].current_hours >= tasks[i].goal_hours && tasks[i].current_mins >= tasks[i].goal_mins) {
                    $('tr#task-'+ i).addClass('done');

                    // Disable toggle buttons
                    if(Setting('no-overtime')) {
                        $('tr#task-'+ i +' button.toggle').attr('disabled', 'disabled');
                        $('tr#task-'+ i +' img.toggle').attr('src', 'style/images/control_play.png').addClass('disabled');
                    }
                    
                    // Show notification and play the sound
                    if(!tasks[i].notified) {
                        tasks[i].notified = true;

                        // Stop the timer
                        if(Setting('no-overtime') || Setting('stop-timer')) toggle_task(i);
                        
                        // Play sound
                        if(Setting('play-sound')) document.getElementById('sound').play();
                        
                        // Show popup
                        if(Setting('show-popup') || (Setting('loop-sound') && Setting('play-sound'))) {
                            alarm_open = true;
                            
                            $('#alarm-txt').text(locale('noteTaskFinishedLong', tasks[i].text));
                            $('#modal, #alarm-menu').fadeIn(600);
                            $('#alarm-menu').center();
                        }
                        
                        // Show Desktop Notification
                        if(Setting('notify') && webkitNotifications.checkPermission() == 0) {
                            webkitNotifications.createNotification('/style/images/icon-64.png', locale('noteTaskFinished'), locale('noteTaskFinishedLong', tasks[i].text)).show();
                        }
                    }
                }
                
                // Progress done
                var progress = Math.floor((tasks[i].current_hours + (tasks[i].current_mins / 60) + (tasks[i].current_secs / 3600)) / (tasks[i].goal_hours + (tasks[i].goal_mins / 60)) * 100);
                if(tasks[i].indefinite) progress = 0;
                if(progress == Infinity) progress = 100;
                
                // Update list
                $('tr#task-'+ i +' td.current').text(format_time(tasks[i].current_hours, tasks[i].current_mins, tasks[i].current_secs));
                if(!tasks[i].indefinite) {
                    $('tr#task-'+ i +' progress').val(progress).attr('max', '100').text(progress.toString() +'%');
                }
                
                // Update task menu if it's shown for this task
                if(displaying_task == i) task_info(i, false, progress);
            }
        }
        
        // Update totals row
        rebuild_totals();
        
        // Update pie charts
        if(timer_step >= Setting('chart-update-time', 3, true)) {
            rebuild_charts();
            timer_step = 0;
        }
        
        // Do it again in a second
        timer = setTimeout('update_time()', Setting('update-time') * 1000);
        timer_step++;
    } catch(e) {
        js_error(e);
    }
}
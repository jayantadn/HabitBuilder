# UI testing
## main page
- Title bar should have enough width
- Title bar font thickness and color
- buttons in correct place: edit, delete, menu
- Add button in the bottom right corner
- Add button is the right size
- Add button is round and the + sign is at the center
- table should fill the entire width of screen
- table header thickness and alignment
- checkboxes are center aligned

## add page
- Title bar
- alignment of text and input fields
- buttons size, position, alignment

## window resize
check the size of
- header bar
- toolbar icons
- header text
- (+) button
- number of columns in table

# populate table
- When the app opens, the table should be filled with previous habits, dates, checkboxes

# Save changes in checkbox.
- Check a box. Reopen the application. See if the box is still checked.
- Uncheck a box. Reopen the application. See if the box is still checked

# Add Habit
- new page should open with text entry field with an add and cancel button
- clicking cancel should go to main page
- clicking add should add a new row with all checkboxes unchecked
- pressing enter should also add the habit
- new habit should be saved on exit
- new row checkbox status should be saved

# delete habit
- selection and de-selection of habit should work
- delete button should only be visible when a habit is selected.
- confirmation dialog before delete
- select and click delete to delete
- after delete the button should disappear and no habit should be selected
- upon closing and opening the app, the deleted habit should not re-appear

# update habit
- textbox should be prefilled. 
- 'Update' button should be visible instead of 'Add'.
- clicking cancel should go to main page
- clicking update, habit name should change
- all checkboxes should have the previous values
- restarting the app should retain the updated habit

# sync data to server
- reset RAM data, local storage and cloud storage individually and check the results.
- sync should happen at app start
- sync should happen every timeout.
- sync should refresh the table
- closing and reopening the app, should retain the data
- server data should be identical to local data
- any changes in the main page (as above) should be reflected in the server file.
- any changes in the main page (as above) should be reflected in another device
- check if sync happens when the window is minimized (on device)
- run the app without internet connection. closing and opening should retain the data.
- deactivate internet in between running app. close and reopen without internet. data should be intact
- deactivate internet in between running app. close and reopen with internet. data should be intact.
- abrupt closing of app
- data tampering on server 

# misc test cases
- pressing the exit button should quit the program

# First time open (reset condition)
- reset only local data, cloud data intact. Upon loading, the table should be loaded with cloud data.
- reset local data and cloud data. empty table should be displayed.
- adding a new habit should be possible without any errors
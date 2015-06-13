var _ = require('underscore');

function did_user_completed_all_theme_challenges(user_completed_challenges, theme_challenges){
		var user_completed_challenge_ids = Object.keys(user_completed_challenges),
		theme_challenge_ids = _.pluck(theme_challenges, 'id');
		console.log("comparing");
		console.log(user_completed_challenge_ids);
		console.log(theme_challenge_ids);

		theme_challenge_ids.forEach(function (theme_challenge_id) {
			if (user_completed_challenge_ids.indexOf(theme_challenge_id) == -1){
				return  false;
			}
		})

		return true;
}

function completed_task_payload(){
	return {"created_at": new Date().getTime()}
}

exports.is_already_completed = function(user_completed_challenges_object, challenge_id) {
	return !!user_completed_challenges_object[challenge_id];
}


exports.mark_challenge_completed = function(user, challenge){
  
	var challenges_completed = user.attributes.challenges_completed || {},
	themes_completed = user.attributes.themes_completed || {};

	challenges_completed[challenge.id] = completed_task_payload();
	user.set("challenges_completed", challenges_completed)
	
	//update user points
	var old_points = user.attributes.points || 0;
	new_points = old_points + parseInt(challenge.attributes.points) 
	user.set("points", new_points);

	//update user completed themes, id needed
	challenge.attributes.themes.forEach(function(theme){
		console.log(challenges_completed);
		var theme_challenges = theme.attributes.challenges;
		console.log(theme_challenges);
		console.log("checking theme" + theme.attributes.name);
		//check if needs to update the themes completed for the user
		if (did_user_completed_all_theme_challenges(challenges_completed, theme_challenges)){
			//actually update in the user model	
			themes_completed[theme.id] = {"created_at": new Date().getTime(), "badge": theme.badge};
			user.set("themes_completed", themes_completed);
			console.log("333");
			console.log(themes_completed);
			user.save();
		}else{
			console.log("did_user NOT _completed_all_theme_challenges");
		}


	});

	user.save(null, {
            success:function (aFoob) {
                console.log("Successfully saved a user");
                return user.attributes;
            },
            error:function (pointAward, error) {
                console.log("Could not save a foob " + error.message);
                return user.attributes;
            }
        }
    );

	return user.attributes;
}



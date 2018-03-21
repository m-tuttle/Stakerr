INSERT INTO users (user, email, phone, user_pw)
VALUES 
    ("Mike", "mike.s.tuttle@gmail.com", "7083723293", "chicago"),
    ("John", "john@fake.com", "3333334444", "password"),
    ("Luke", "luke@fake.com", "9991112222", "password"),
    ("jaystep", "jstepanovich91@gmail.com", "8477156640", "password");

INSERT INTO goals (user_id, goal_text, goal_start, goal_end, raised, max_wager, descript)
VALUES 
    (1, "Win in Super Smash Bros", "2018/3/15", "2018/3/30", 0, 500, "I will dominate everyone using either Donkey Kong or Mario."),
    (2, "Build a wooden dresser", "2018/3/15", "2018/4/30", 0, 400, "Using my handy craftsmanship I will create the most beautiful wooden dresser you've ever seen."),
    (3, "Lose 15 pounds", "2018/3/15", "2018/5/30", 0, 300, "I am a fat lard and I need to lose some weight before the summer comes around.");


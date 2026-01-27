import turtle

player1 = input("Enter name of player 1: ")
score_a = 0

# Display screen
win = turtle.Screen()
win.setup(800, 600)
win.bgcolor("blue")
win.title("Single Player Pong Game")
win.tracer(0)

# Left Paddle
left_paddle = turtle.Turtle()
left_paddle.speed(0)
left_paddle.shape("square")
left_paddle.shapesize(stretch_wid=4, stretch_len=1)
left_paddle.color("white")
left_paddle.penup()
left_paddle.goto(-380, 0)

# Ball
ball = turtle.Turtle()
ball.speed(0)
ball.color("white")
ball.shape("circle")
ball.penup()
ball.dx = 0.1
ball.dy = 0.1

# Scoreboard
pen = turtle.Turtle()
pen.speed(0)
pen.color("white")
pen.penup()
pen.hideturtle()
pen.goto(0, 260)
pen.write(player1 + " : " + str(score_a), align="center", font=("Arial", 24, "normal"))

# Moving Paddle
def left_paddle_up():
    if left_paddle.ycor() < 250:
        left_paddle.sety(left_paddle.ycor() + 20)

def left_paddle_down():
    if left_paddle.ycor() > -250:
        left_paddle.sety(left_paddle.ycor() - 20)

# Keyboard Bindings
win.listen()
win.onkeypress(left_paddle_up, 'w')
win.onkeypress(left_paddle_down, 's')

# Game Loop
while True:
    win.update()

    # Ball Movement
    ball.setx(ball.xcor() + ball.dx)
    ball.sety(ball.ycor() + ball.dy)

    # Ball Collision with Top and Bottom Walls
    if ball.ycor() > 290:
        ball.sety(290)
        ball.dy *= -1

    if ball.ycor() < -290:
        ball.sety(-290)
        ball.dy *= -1

    # Ball Collision with Left Paddle
    if (ball.xcor() < -360 and ball.xcor() > -370) and (ball.ycor() < left_paddle.ycor() + 40 and ball.ycor() > left_paddle.ycor() - 40):
        ball.setx(-360)
        ball.dx *= -1

    # Ball Misses the Paddle
    if ball.xcor() > 390:
        ball.goto(0, 0)
        ball.dx *= -1
        score_a += 1
        pen.clear()
        pen.write(player1 + " : " + str(score_a), align="center", font=("Arial", 24, "normal"))

    # Ball Hits Left Wall
    if ball.xcor() < -390:
        ball.goto(0, 0)
        ball.dx *= -1
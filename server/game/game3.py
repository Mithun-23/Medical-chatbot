import pygame
import random

# Initialize Pygame
pygame.init()

# Screen dimensions
WIDTH, HEIGHT = 400, 600
screen = pygame.display.set_mode((WIDTH, HEIGHT))
pygame.display.set_caption('Flappy Bird')

# Colors
WHITE = (255, 255, 255)
BLACK = (0, 0, 0)

# Game Variables
gravity = 0.5
bird_movement = 0
game_active = True
score = 0
pipe_speed = 5

# Load Images
bg_surface = pygame.image.load('background.png').convert()
bg_surface = pygame.transform.scale(bg_surface, (WIDTH, HEIGHT))

bird_surface = pygame.image.load('bird.png').convert_alpha()
bird_rect = bird_surface.get_rect(center=(100, HEIGHT//2))

pipe_surface = pygame.image.load('pipe.png').convert_alpha()
pipe_list = []

# Create a pipe
def create_pipe():
    pipe_height = random.randint(200, 400)
    bottom_pipe = pipe_surface.get_rect(midtop=(500, pipe_height))
    top_pipe = pipe_surface.get_rect(midbottom=(500, pipe_height - 150))
    return bottom_pipe, top_pipe

# Move pipes
def move_pipes(pipes):
    for pipe in pipes:
        pipe.centerx -= pipe_speed
    return pipes

# Draw pipes
def draw_pipes(pipes):
    for pipe in pipes:
        if pipe.bottom >= HEIGHT:
            screen.blit(pipe_surface, pipe)
        else:
            flip_pipe = pygame.transform.flip(pipe_surface, False, True)
            screen.blit(flip_pipe, pipe)

# Check collision
def check_collision(pipes):
    global game_active
    for pipe in pipes:
        if bird_rect.colliderect(pipe):
            game_active = False
    if bird_rect.top <= 0 or bird_rect.bottom >= HEIGHT:
        game_active = False

# Display score
def display_score():
    font = pygame.font.Font(None, 50)
    text = font.render(f'Score: {score}', True, BLACK)
    screen.blit(text, (10, 10))

# Timer for pipe creation
SPAWNPIPE = pygame.USEREVENT
pygame.time.set_timer(SPAWNPIPE, 1500)

# Game loop
clock = pygame.time.Clock()

while True:
    for event in pygame.event.get():
        if event.type == pygame.QUIT:
            pygame.quit()
            exit()
        if event.type == pygame.KEYDOWN:
            if event.key == pygame.K_SPACE and game_active:
                bird_movement = 0
                bird_movement -= 10
            if event.key == pygame.K_SPACE and not game_active:
                game_active = True
                pipe_list.clear()
                bird_rect.center = (100, HEIGHT//2)
                bird_movement = 0
                score = 0

        if event.type == SPAWNPIPE:
            pipe_list.extend(create_pipe())

    # Background
    screen.blit(bg_surface, (0, 0))

    if game_active:
        # Bird movement
        bird_movement += gravity
        bird_rect.centery += bird_movement
        screen.blit(bird_surface, bird_rect)

        # Pipe movement
        pipe_list = move_pipes(pipe_list)
        draw_pipes(pipe_list)

        # Collision
        check_collision(pipe_list)

        # Increase score
        for pipe in pipe_list:
            if pipe.centerx == 100:
                score += 1

        # Display score
        display_score()
    else:
        font = pygame.font.Font(None, 70)
        text = font.render('Game Over', True, BLACK)
        screen.blit(text, (100, 250))

    # Update screen
    pygame.display.update()
    clock.tick(60)

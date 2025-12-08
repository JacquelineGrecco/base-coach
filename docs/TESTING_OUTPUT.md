MODULE 1: Authentication & User Management:
        - I created a new coach account
        - I logged in with the email.
        - I clicked on the "Editar Perfil" button.
        - I clicked on the "Alterar foto" button.
        - I clicked on the "Salvar alterações" button.
        - I clicked on the "Exportar meus dados" button.
        - I clicked on the "Deletar Conta" button.
        - I tried to recover my account with the email
    My personal feedback:
        - The UI for the user creation was user friendly and easy to use, but is missing a few valitations: 
           -- We don't have a phone number field or validation.
           -- We don't have a email validation. We don't know if is a valid email or if is already in use.
        - I notice a big delay when the user is being recovered. Between sending the email and the user being recovered, there is a big delay. Also, we notice that the user is trying to acess with a deleted account, we should show a link to "Recuperar minha conta" to the user, collect feedback why they deleted and how we can improve the system. 
        - I need to recreate the account with the same email and password, if this is being before the 365 days, we should be able to recover this account. 
        - If the user is trying to recover a deleted account, we aren't receiving the email to recover the account.
        - Something that I realized, if the customer requested to deleted the account, we have a trigger to delete everything in 7 days, maybe we shouldn't do it. 
        - For the users that were created, we should be able to block the account after 3 incorrent login attempts, we should show a message to the user that his account was blocked, and he should wait 60 seconds to unblock the account. (we should have the countdown timer). 

    My suggestion for this module: 
        - Lets work on the feedback and leave the improvements for the next run. 


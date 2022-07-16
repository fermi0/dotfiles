log_file_name = "log_query.txt"

f = open("query.txt", "r")
names = f.readlines()
f.close()


try:
    print(names[0])

    log_query_file = open(log_file_name, "a+")
    log_query_file.write(names[0])
    log_query_file.close()

    del names[0]

    new_file = open("query.txt", "w+")
    for name in names:
        new_file.write(name)

    new_file.close()

except:
    print("End Of Line")


    


FROM frolvlad/alpine-oraclejdk8:slim
VOLUME /tmp
ADD ho-0.0.1-SNAPSHOT.jar app.jar
ENTRYPOINT ["java","-Djava.securimvn package docker:buildty.egd=file:/dev/./urandom","-jar","/app.jar"]
#!/bin/bash
# set -e  # disabled - Gradle may have transient warnings
export JAVA_HOME=/usr/lib/jvm/java-17-openjdk-amd64
export ANDROID_HOME=/home/mikhail/Android/Sdk
export PATH=$JAVA_HOME/bin:$ANDROID_HOME/cmdline-tools/latest/bin:$ANDROID_HOME/platform-tools:$PATH

cd /home/mikhail/.openclaw/workspace/TalkingMirror/apps/android/android

export GRADLE_OPTS="-Dorg.gradle.jvmargs='-XX:MaxMetaspaceSize=512m -Xmx2g -XX:+HeapDumpOnOutOfMemoryError'"
set -a
source /home/mikhail/.openclaw/workspace/TalkingMirror/.env 2>/dev/null || true
source /home/mikhail/.openclaw/workspace/TalkingMirror/apps/android/.env 2>/dev/null || true
set +a

export SENTRY_ORG=bright-software
export SENTRY_PROJECT=talking-mirror

echo "=== Build started at $(date) ==="
echo "Java: $(java -version 2>&1 | head -1)"
echo "Sentry: $SENTRY_ORG/$SENTRY_PROJECT"

./gradlew assembleRelease --no-daemon -Dorg.gradle.parallel=false 2>&1

echo "=== Build finished at $(date) ==="
ls -la app/build/outputs/apk/release/*.apk 2>/dev/null && echo "APK OK" || echo "NO APK"

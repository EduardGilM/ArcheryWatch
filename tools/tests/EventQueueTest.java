package com.archerywatch.app;

public class EventQueueTest {
    public static void main(String[] args) {
        class Disk implements EventQueue.Disk {
            String data = ""; boolean fail;
            public String read() { return data; }
            public boolean write(String value) { if (fail) return false; data=value; return true; }
        }
        Disk disk = new Disk(); EventQueue q = new EventQueue(disk);
        q.offer("liveStart('sesión')"); q.offer("liveShot({t:1})");
        long first = q.peek().id; q.ack(first+1);
        if (q.peek().id != first) throw new AssertionError("Wrong ACK removed event");
        q = new EventQueue(disk);
        if (!q.peek().js.contains("sesión")) throw new AssertionError("Lost durable payload");
        q.ack(first); long second=q.peek().id; q.ack(first);
        if (q.peek().id != second) throw new AssertionError("Duplicate ACK removed next event");
        disk.fail=true;
        try { q.ack(second); throw new AssertionError("Ignored disk failure"); } catch (IllegalStateException expected) { }
        if (q.peek().id != second) throw new AssertionError("Lost uncommitted event");
        disk.fail=false; q.ack(second); q=new EventQueue(disk);
        if (q.peek()!=null) throw new AssertionError("Replayed acknowledged event");
        q.offer("liveEnd()"); if(q.peek().id<=second) throw new AssertionError("Reused event id");
        System.out.println("EventQueue: persistence, FIFO, duplicate ACK and disk failure PASS");
    }
}

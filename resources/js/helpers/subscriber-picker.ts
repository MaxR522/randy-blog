/** A confirmed subscriber as `NewsletterController::subscribers` lists it. */
export type PickedSubscriber = { id: number; email: string };

/** A page of the subscriber search. */
export type SubscriberPage = {
    data: PickedSubscriber[];
    total: number;
    currentPage: number;
    lastPage: number;
};
